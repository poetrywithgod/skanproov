-- SKANPROOV: manufacturer portal, step 3 (batches).
--
-- A manufacturer declares a batch of one of its registered products. Declaring is instant (decision
-- of 13 Nov 2026): there is no review step yet. A batch's codes are generated afterwards (next step)
-- and stay inactive until the manufacturer releases the batch at dispatch (Option A, kept for this
-- phase). Releasing needs at least one generated code and cannot be undone here; recalls are a
-- separate action.
--
-- Like the products, everything is read and written through functions that check the caller belongs
-- to the manufacturer (and passed the two-factor step, if they use it). The tables stay closed to the
-- API. The optional certificate of analysis goes in a private bucket, in a folder named after the
-- manufacturer; only its members can add, read or remove files.

-- 1. More details on a batch.
alter table public.batches
  add column batch_no bigint generated always as identity,
  add column facility text check (facility is null or char_length(facility) between 1 and 120),
  add column notes text check (notes is null or char_length(notes) between 1 and 500),
  add column certificate_path text check (certificate_path is null or char_length(certificate_path) between 1 and 300),
  add column declared_by uuid references auth.users (id) on delete set null,
  add column updated_at timestamptz not null default now();

create trigger batches_set_updated_at
  before update on public.batches
  for each row execute function public.set_updated_at();

-- 2. The private bucket for certificates of analysis: PDF, JPG or PNG, up to 5 MB.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('batch-certificates', 'batch-certificates', false, 5242880,
        array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

create policy batch_certificates_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'batch-certificates' and public.is_manufacturer_member((storage.foldername(name))[1]));
create policy batch_certificates_select on storage.objects for select to authenticated
  using (bucket_id = 'batch-certificates' and public.is_manufacturer_member((storage.foldername(name))[1]));
create policy batch_certificates_delete on storage.objects for delete to authenticated
  using (bucket_id = 'batch-certificates' and public.is_manufacturer_member((storage.foldername(name))[1]));

-- 3. Reading batches.
create function public.my_batches()
returns table (
  id uuid, batch_no bigint, batch_number text, product_id uuid, product_name text, variant text,
  sku text, manufactured_on date, expires_on date, units integer, status text,
  released_at timestamptz, codes_generated bigint, created_at timestamptz
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
    select b.id, b.batch_no, b.batch_number, p.id, p.name, p.variant, p.sku,
           b.manufactured_on, b.expires_on, b.units, b.status, b.released_at,
           (select count(*) from public.codes c where c.batch_id = b.id),
           b.created_at
      from public.batches b
      join public.products p on p.id = b.product_id
     where p.manufacturer_id = v_m
     order by b.created_at desc;
end;
$$;

create function public.my_batch(p_id uuid)
returns table (
  id uuid, batch_no bigint, batch_number text, product_id uuid, product_name text, variant text,
  sku text, manufactured_on date, expires_on date, units integer, status text,
  released_at timestamptz, codes_generated bigint, facility text, notes text,
  certificate_path text, declared_by_name text, created_at timestamptz
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
    select b.id, b.batch_no, b.batch_number, p.id, p.name, p.variant, p.sku,
           b.manufactured_on, b.expires_on, b.units, b.status, b.released_at,
           (select count(*) from public.codes c where c.batch_id = b.id),
           b.facility, b.notes, b.certificate_path, pr.full_name, b.created_at
      from public.batches b
      join public.products p on p.id = b.product_id
      left join public.profiles pr on pr.id = b.declared_by
     where b.id = p_id and p.manufacturer_id = v_m;
end;
$$;

-- 4. Declaring a batch. p holds the details (the app checks them first; the table's checks are the
--    backstop). Returns the new batch's id.
create function public.declare_batch(p jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_m uuid := public.current_manufacturer_id();
  v_product uuid := nullif(p ->> 'productId', '')::uuid;
  v_status text;
  v_made date := (p ->> 'manufacturedOn')::date;
  v_expires date := nullif(p ->> 'expiresOn', '')::date;
  v_units integer := (p ->> 'units')::integer;
  v_cert text := nullif(btrim(coalesce(p ->> 'certificatePath', '')), '');
  v_today date := (now() at time zone 'Africa/Lagos')::date;
  v_id uuid;
begin
  select status into v_status from public.products where id = v_product and manufacturer_id = v_m;
  if not found then raise exception 'no such product'; end if;
  if v_status = 'draft' then raise exception 'product is a draft'; end if;

  if v_made is null or v_made > v_today then raise exception 'bad manufacture date'; end if;
  if v_expires is not null and v_expires <= v_made then raise exception 'bad expiry date'; end if;

  -- Certificates live in the manufacturer's own folder.
  if v_cert is not null and split_part(v_cert, '/', 1) <> v_m::text then raise exception 'wrong folder'; end if;

  begin
    insert into public.batches (
      product_id, batch_number, manufactured_on, expires_on, units, facility, notes,
      certificate_path, declared_by
    ) values (
      v_product, btrim(p ->> 'batchNumber'), v_made, v_expires, v_units,
      nullif(btrim(coalesce(p ->> 'facility', '')), ''),
      nullif(btrim(coalesce(p ->> 'notes', '')), ''),
      v_cert, auth.uid()
    ) returning id into v_id;
  exception when unique_violation then
    raise exception 'batch number taken';
  end;
  return v_id;
end;
$$;

-- 5. Releasing a batch at dispatch: from now on its codes verify. Needs at least one generated code.
--    Releasing twice is harmless (it keeps the first release time). Returns the release time.
create function public.release_batch(p_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_m uuid := public.current_manufacturer_id();
  b public.batches%rowtype;
begin
  select bt.* into b
    from public.batches bt
    join public.products p on p.id = bt.product_id
   where bt.id = p_id and p.manufacturer_id = v_m
     for update of bt;
  if not found then raise exception 'no such batch'; end if;
  if b.status <> 'active' then raise exception 'batch is %', b.status; end if;
  if b.released_at is not null then return b.released_at; end if;
  if not exists (select 1 from public.codes where batch_id = b.id) then raise exception 'no codes'; end if;

  update public.batches set released_at = now() where id = b.id returning released_at into b.released_at;
  return b.released_at;
end;
$$;

revoke execute on function
  public.my_batches(), public.my_batch(uuid), public.declare_batch(jsonb), public.release_batch(uuid)
  from public, anon;
grant execute on function
  public.my_batches(), public.my_batch(uuid), public.declare_batch(jsonb), public.release_batch(uuid)
  to authenticated;
