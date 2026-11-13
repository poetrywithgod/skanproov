-- SKANPROOV: manufacturer portal, step 4 (generating verification codes).
--
-- A manufacturer generates codes for a declared batch, one run at a time, up to the number of units
-- it declared. For every unit a run makes a random QR code and a random 12-digit backup PIN.
--
-- The database keeps only hashes (SHA-256), as it always has. The readable codes are returned once,
-- to the app, which turns them into a CSV file and a label PDF and stores those in a private bucket
-- for 30 days (decision of 13 Nov 2026). Nobody, including SKANPROOV, can read a code back from the
-- database afterwards. If building the files fails, the run is discarded (discard_code_run) so no
-- code is left that nobody has seen.
--
-- A QR code is the address "https://skanproov.com/v/<token>"; only the 16-character token is hashed
-- and matched, as the scanner already works. Codes are generated only while a batch is not released
-- (Option A): releasing is what makes them verify, so nothing new can appear inside a released batch.
-- Runs are limited to 50,000 codes so a single request stays a sensible size.

create extension if not exists pgcrypto with schema extensions;

-- 1. One row per generation run.
create table public.code_runs (
  id uuid primary key default gen_random_uuid(),
  run_no bigint generated always as identity,
  batch_id uuid not null references public.batches (id) on delete cascade,
  quantity integer not null check (quantity between 1 and 50000),
  generated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  csv_path text check (csv_path is null or char_length(csv_path) between 1 and 300),
  pdf_path text check (pdf_path is null or char_length(pdf_path) between 1 and 300),
  files_expire_at timestamptz,
  files_removed_at timestamptz
);

create index code_runs_batch_idx on public.code_runs (batch_id, created_at desc);

alter table public.codes add column run_id uuid references public.code_runs (id) on delete cascade;
create index codes_run_idx on public.codes (run_id);

revoke all on public.code_runs from anon, authenticated;
alter table public.code_runs enable row level security;
create policy mfa_required on public.code_runs as restrictive for all to authenticated using (public.mfa_satisfied());

-- 2. The private bucket for the CSV and label PDF files: up to 50 MB each, readable by members only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('code-files', 'code-files', false, 52428800, array['text/csv', 'application/pdf'])
on conflict (id) do nothing;

create policy code_files_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'code-files' and public.is_manufacturer_member((storage.foldername(name))[1]));
create policy code_files_select on storage.objects for select to authenticated
  using (bucket_id = 'code-files' and public.is_manufacturer_member((storage.foldername(name))[1]));
create policy code_files_delete on storage.objects for delete to authenticated
  using (bucket_id = 'code-files' and public.is_manufacturer_member((storage.foldername(name))[1]));

-- 3. Random pieces. Not callable from the API.
create function public.random_code_token()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  -- 32 letters and digits with no 0, O, 1, I, so a code is easy to read; 256 is a multiple of 32,
  -- so every character is equally likely.
  v_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_bytes bytea := extensions.gen_random_bytes(16);
  v_out text := '';
begin
  for i in 0..15 loop
    v_out := v_out || substr(v_alphabet, (get_byte(v_bytes, i) % 32) + 1, 1);
  end loop;
  return v_out;
end;
$$;

create function public.random_backup_pin()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  v_bytes bytea := extensions.gen_random_bytes(8);
  v_n numeric := 0;
begin
  for i in 0..7 loop
    v_n := v_n * 256 + get_byte(v_bytes, i);
  end loop;
  return lpad((v_n % 1000000000000)::bigint::text, 12, '0');
end;
$$;

revoke execute on function public.random_code_token(), public.random_backup_pin() from public, anon, authenticated;

-- 4. Generating a run. Returns one row per new code: the run, its token and its backup PIN. The
--    readable codes exist only in this result; only their hashes are stored.
create function public.generate_codes(p_batch uuid, p_quantity integer)
returns table (run_id uuid, run_no bigint, token text, pin text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_m uuid := public.current_manufacturer_id();
  b public.batches%rowtype;
  v_existing bigint;
  v_run uuid;
  v_run_no bigint;
  v_done integer := 0;
  v_tokens text[];
  v_pins text[];
  v_attempts integer := 0;
begin
  if p_quantity is null or p_quantity < 1 then raise exception 'bad quantity'; end if;
  if p_quantity > 50000 then raise exception 'too many at once'; end if;

  select bt.* into b
    from public.batches bt
    join public.products p on p.id = bt.product_id
   where bt.id = p_batch and p.manufacturer_id = v_m
     for update of bt;
  if not found then raise exception 'no such batch'; end if;
  if b.status <> 'active' then raise exception 'batch is %', b.status; end if;
  if b.released_at is not null then raise exception 'batch released'; end if;
  if b.units is null then raise exception 'no unit count'; end if;

  select count(*) into v_existing from public.codes where batch_id = b.id;
  if v_existing + p_quantity > b.units then raise exception 'over the units'; end if;

  insert into public.code_runs (batch_id, quantity, generated_by)
  values (b.id, p_quantity, auth.uid())
  returning code_runs.id, code_runs.run_no into v_run, v_run_no;

  -- Insert in rounds: a clash with an existing code (astronomically rare) is skipped and retried.
  while v_done < p_quantity loop
    v_attempts := v_attempts + 1;
    if v_attempts > 20 then raise exception 'could not generate unique codes'; end if;

    with cand as (
      select public.random_code_token() as tok, public.random_backup_pin() as pn
        from generate_series(1, p_quantity - v_done)
    ),
    ins as (
      insert into public.codes (batch_id, run_id, qr_hash, pin_hash)
      select b.id, v_run, public.code_hash(c.tok), public.code_hash(c.pn) from cand c
      on conflict do nothing
      returning qr_hash
    )
    select array_agg(c.tok), array_agg(c.pn) into v_tokens, v_pins
      from cand c join ins on ins.qr_hash = public.code_hash(c.tok);

    if v_tokens is not null then
      v_done := v_done + array_length(v_tokens, 1);
      return query select v_run, v_run_no, t.tok, t.pn
                     from unnest(v_tokens, v_pins) as t(tok, pn);
    end if;
  end loop;
end;
$$;

-- 5. After the files are built and stored, record them. They are kept 30 days.
create function public.attach_code_run_files(p_run uuid, p_csv text, p_pdf text)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_m uuid := public.current_manufacturer_id();
  v_expires timestamptz := now() + interval '30 days';
begin
  if split_part(p_csv, '/', 1) <> v_m::text or split_part(p_pdf, '/', 1) <> v_m::text then
    raise exception 'wrong folder';
  end if;
  update public.code_runs r
     set csv_path = p_csv, pdf_path = p_pdf, files_expire_at = v_expires
    from public.batches b
    join public.products p on p.id = b.product_id
   where r.id = p_run and b.id = r.batch_id and p.manufacturer_id = v_m;
  if not found then raise exception 'no such run'; end if;
  return v_expires;
end;
$$;

-- 6. If building the files failed, throw the run away so no unseen codes remain. Only possible while
--    the batch is unreleased and the run has no files.
create function public.discard_code_run(p_run uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_m uuid := public.current_manufacturer_id();
begin
  delete from public.code_runs r
   using public.batches b, public.products p
   where r.id = p_run and b.id = r.batch_id and p.id = b.product_id and p.manufacturer_id = v_m
     and r.csv_path is null and b.released_at is null;
  if not found then raise exception 'cannot discard'; end if;
end;
$$;

-- 7. Reading runs (newest first), optionally for one batch.
create function public.my_code_runs(p_batch uuid default null)
returns table (
  id uuid, run_no bigint, batch_id uuid, batch_number text, product_name text, variant text,
  quantity integer, generated_by_name text, created_at timestamptz,
  csv_path text, pdf_path text, files_expire_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_m uuid := public.current_manufacturer_id();
begin
  return query
    select r.id, r.run_no, b.id, b.batch_number, p.name, p.variant, r.quantity, pr.full_name, r.created_at,
           r.csv_path, r.pdf_path, r.files_expire_at
      from public.code_runs r
      join public.batches b on b.id = r.batch_id
      join public.products p on p.id = b.product_id
      left join public.profiles pr on pr.id = r.generated_by
     where p.manufacturer_id = v_m and (p_batch is null or b.id = p_batch)
     order by r.created_at desc;
end;
$$;

-- 8. Files older than 30 days: returns their paths (for the app to delete from storage) and clears
--    them from the run. The run itself stays in the history.
create function public.claim_expired_code_files()
returns table (path text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_m uuid := public.current_manufacturer_id();
begin
  return query
    with due as (
      select r.id, r.csv_path as c, r.pdf_path as f
        from public.code_runs r
        join public.batches b on b.id = r.batch_id
        join public.products p on p.id = b.product_id
       where p.manufacturer_id = v_m and r.files_expire_at <= now() and r.files_removed_at is null
         for update of r
    ),
    done as (
      update public.code_runs r
         set csv_path = null, pdf_path = null, files_removed_at = now()
        from due where r.id = due.id
      returning due.c, due.f
    )
    select unnest(array[done.c, done.f]) from done;
end;
$$;

revoke execute on function
  public.generate_codes(uuid, integer), public.attach_code_run_files(uuid, text, text),
  public.discard_code_run(uuid), public.my_code_runs(uuid), public.claim_expired_code_files()
  from public, anon;
grant execute on function
  public.generate_codes(uuid, integer), public.attach_code_run_files(uuid, text, text),
  public.discard_code_run(uuid), public.my_code_runs(uuid), public.claim_expired_code_files()
  to authenticated;
