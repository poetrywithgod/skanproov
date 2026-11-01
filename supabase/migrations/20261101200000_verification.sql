-- SKANPROOV: product verification, scan history, reward points and notifications (Phase 1).
--
-- Manufacturers, products, batches and codes are private: nobody can read them through the API.
-- The only way in is public.verify_product(), which checks a code and, for a signed-in person,
-- records the scan, awards points and writes a notification, all in one step.
--
-- Codes are stored as SHA-256 hashes, never as plain text.
--
-- Rules implemented here (to be confirmed with the client):
--   * A code only works once its batch has been released (Option A: release at dispatch).
--   * The first signed-in person to scan a genuine code owns it and earns the product's points once.
--   * Scanning it again as the same person is still genuine and earns nothing more.
--   * A different signed-in person scanning it makes it a "duplicate" for everyone from then on.
--   * Recalled or revoked batches show as recalled; passed expiry dates show as expired.
--   * Scanning without an account never changes anything; it only reads the current state.

create table public.manufacturers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 2 and 160),
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  manufacturer_id uuid not null references public.manufacturers (id) on delete restrict,
  name text not null check (char_length(name) between 2 and 160),
  variant text,
  nafdac_number text,
  -- Points a shopper earns for the first genuine scan of a code.
  points_per_scan integer not null default 50 check (points_per_scan >= 0),
  created_at timestamptz not null default now()
);

create table public.batches (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete restrict,
  batch_number text not null check (char_length(batch_number) between 1 and 80),
  manufactured_on date not null,
  expires_on date,
  status text not null default 'active' check (status in ('active', 'recalled', 'revoked')),
  -- Empty until the manufacturer releases the batch at dispatch; codes do not verify before then.
  released_at timestamptz,
  created_at timestamptz not null default now(),
  unique (product_id, batch_number)
);

create table public.codes (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.batches (id) on delete restrict,
  -- SHA-256 (hex) of the upper-cased QR payload, and of the 12-digit backup PIN.
  qr_hash text not null unique,
  pin_hash text unique,
  first_scanned_by uuid references auth.users (id) on delete set null,
  first_scanned_at timestamptz,
  scan_count integer not null default 0,
  flagged_duplicate boolean not null default false,
  created_at timestamptz not null default now()
);

create index codes_batch_id_idx on public.codes (batch_id);

create table public.scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Empty when the code was not recognised.
  code_id uuid references public.codes (id) on delete set null,
  -- What the person scanned or typed (upper-cased), so History can open it again.
  code_input text not null,
  result text not null check (result in ('genuine', 'duplicate', 'recalled', 'expired', 'not_verified')),
  -- A copy of the product details at scan time, so History does not depend on live catalogue rows.
  product_name text,
  variant text,
  manufacturer_name text,
  batch_number text,
  nafdac_number text,
  note text,
  points integer not null default 0,
  scanned_at timestamptz not null default now()
);

create unique index scans_user_code_result_idx on public.scans (user_id, code_id, result) where code_id is not null;
create unique index scans_user_unknown_input_idx on public.scans (user_id, code_input) where code_id is null;
create index scans_user_time_idx on public.scans (user_id, scanned_at desc);

create table public.points_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  scan_id uuid references public.scans (id) on delete set null,
  -- Positive when earned, negative when redeemed.
  points integer not null check (points <> 0),
  kind text not null check (kind in ('earned', 'redeemed')),
  created_at timestamptz not null default now()
);

create index points_ledger_user_idx on public.points_ledger (user_id, created_at desc);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  scan_id uuid references public.scans (id) on delete cascade,
  kind text not null check (kind in ('verified', 'unverified', 'recalled', 'expired')),
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on public.notifications (user_id, created_at desc);

-- Lock everything down. Supabase grants new tables to the API roles by default; undo that first.
revoke all on public.manufacturers, public.products, public.batches, public.codes,
  public.scans, public.points_ledger, public.notifications from anon, authenticated;

alter table public.manufacturers enable row level security;
alter table public.products enable row level security;
alter table public.batches enable row level security;
alter table public.codes enable row level security;
alter table public.scans enable row level security;
alter table public.points_ledger enable row level security;
alter table public.notifications enable row level security;

-- People can read only their own history, points and notifications. Nothing can be written directly.
grant select on public.scans, public.points_ledger, public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

create policy scans_select_own on public.scans for select to authenticated using (user_id = auth.uid());
create policy points_select_own on public.points_ledger for select to authenticated using (user_id = auth.uid());
create policy notifications_select_own on public.notifications for select to authenticated using (user_id = auth.uid());
create policy notifications_mark_read on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Hashing helper, used by verify_product and by the seed/code-generation tools. Not callable from the API.
create function public.code_hash(p_code text)
returns text
language sql
immutable
set search_path = ''
as $$
  select encode(sha256(convert_to(p_code, 'UTF8')), 'hex');
$$;

revoke execute on function public.code_hash(text) from public, anon, authenticated;

-- The reward balance for the signed-in person.
create function public.my_points()
returns integer
language sql
stable
set search_path = ''
as $$
  select coalesce(sum(points), 0)::integer from public.points_ledger where user_id = auth.uid();
$$;

revoke execute on function public.my_points() from public, anon;
grant execute on function public.my_points() to authenticated;

-- Checks a scanned or typed code. Returns {status, product, points}:
--   status: genuine | duplicate | recalled | expired | not_verified
create function public.verify_product(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_input text := upper(left(btrim(coalesce(p_code, '')), 64));
  v_pin text := regexp_replace(upper(left(btrim(coalesce(p_code, '')), 64)), '[\s-]', '', 'g');
  v_uid uuid := auth.uid();
  r record;
  v_status text;
  v_points integer := 0;
  v_scan_id uuid;
  v_note text;
  v_title text;
  v_body text;
  v_kind text;
  v_today date := (now() at time zone 'Africa/Lagos')::date;
  v_product jsonb;
begin
  if v_input = '' then
    return jsonb_build_object('status', 'not_verified');
  end if;

  select c.id as code_id, c.first_scanned_by, c.flagged_duplicate,
         b.status as batch_status, b.released_at, b.expires_on, b.batch_number, b.manufactured_on,
         p.name, p.variant, p.nafdac_number, p.points_per_scan, m.name as manufacturer
    into r
    from public.codes c
    join public.batches b on b.id = c.batch_id
    join public.products p on p.id = b.product_id
    join public.manufacturers m on m.id = p.manufacturer_id
   where c.qr_hash = public.code_hash(v_input)
      or (v_pin ~ '^[0-9]{12}$' and c.pin_hash = public.code_hash(v_pin))
   for update of c;

  -- Unknown, or the batch has not been released yet: we cannot confirm it. Never a verdict of "fake".
  if not found or r.released_at is null then
    if v_uid is not null then
      insert into public.scans (user_id, code_input, result)
      values (v_uid, v_input, 'not_verified')
      on conflict (user_id, code_input) where code_id is null do nothing;
    end if;
    return jsonb_build_object('status', 'not_verified');
  end if;

  v_product := jsonb_build_object(
    'name', r.name,
    'variant', r.variant,
    'manufacturer', r.manufacturer,
    'batch_number', r.batch_number,
    'nafdac_number', r.nafdac_number,
    'manufactured_on', r.manufactured_on,
    'expires_on', r.expires_on
  );

  if r.batch_status in ('recalled', 'revoked') then
    v_status := 'recalled';
    v_note := 'This batch has been recalled by the manufacturer.';
  elsif r.expires_on is not null and r.expires_on < v_today then
    v_status := 'expired';
    v_note := 'This product has passed its expiry date.';
  elsif v_uid is null then
    -- Without an account we only read the current state; we never change it.
    v_status := case when r.flagged_duplicate then 'duplicate' else 'genuine' end;
  elsif r.first_scanned_by is null or r.first_scanned_by = v_uid then
    v_status := 'genuine';
  else
    v_status := 'duplicate';
  end if;

  if v_status = 'duplicate' then
    v_note := 'This code was already scanned by someone else.';
  end if;

  if v_uid is not null then
    if v_status = 'genuine' and r.first_scanned_by is null then
      v_points := r.points_per_scan;
    end if;

    insert into public.scans (user_id, code_id, code_input, result, product_name, variant, manufacturer_name,
                              batch_number, nafdac_number, note, points)
    values (v_uid, r.code_id, v_input, v_status, r.name, r.variant, r.manufacturer,
            r.batch_number, r.nafdac_number, v_note, v_points)
    on conflict (user_id, code_id, result) where code_id is not null do nothing
    returning id into v_scan_id;

    if v_scan_id is null then
      -- Seen before by this person: show the result again, but nothing new is recorded or earned.
      v_points := 0;
    else
      update public.codes
         set scan_count = scan_count + 1,
             flagged_duplicate = flagged_duplicate or v_status = 'duplicate',
             first_scanned_by = case when v_status = 'genuine' and first_scanned_by is null then v_uid else first_scanned_by end,
             first_scanned_at = case when v_status = 'genuine' and first_scanned_by is null then now() else first_scanned_at end
       where id = r.code_id;

      if v_points > 0 then
        insert into public.points_ledger (user_id, scan_id, points, kind) values (v_uid, v_scan_id, v_points, 'earned');
      end if;

      v_kind := case v_status
        when 'genuine' then 'verified'
        when 'duplicate' then 'unverified'
        else v_status
      end;
      v_title := case v_status
        when 'genuine' then 'Your product has been verified!'
        when 'duplicate' then 'Your product is Unverified!'
        when 'recalled' then 'This Product Has Been Recalled'
        else 'Expired Product'
      end;
      v_body := case v_status
        when 'genuine' then 'Good news! Your scanned product is registered with SKANPROOV and has passed its verification checks.'
        when 'duplicate' then 'This product has unusual verification activity. Please review the scan result before proceeding.'
        when 'recalled' then 'This product has been recalled by the manufacturer. Do not purchase or use it. Follow the recommended next steps.'
        else 'This product has passed its expiry date. Do not purchase or use it.'
      end;
      insert into public.notifications (user_id, scan_id, kind, title, body)
      values (v_uid, v_scan_id, v_kind, v_title, v_body);
    end if;
  end if;

  return jsonb_build_object('status', v_status, 'product', v_product, 'points', v_points);
end;
$$;

revoke execute on function public.verify_product(text) from public;
grant execute on function public.verify_product(text) to anon, authenticated;
