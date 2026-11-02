-- SKANPROOV: retailer app (Phase 1).
--
-- A retailer is a shop that receives cartons from manufacturers. They sign up, register a branch,
-- and a Super Admin approves the branch before it can receive stock. A retailer connects to a
-- manufacturer with no approval (decision of 22 Oct 2026) and only cartons from connected
-- manufacturers can be confirmed safe. Recalled and expired cartons are always flagged.
--
-- All writes go through functions, so the tables stay closed to the API. Retailers can read
-- only their own rows.

create table public.retailers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users (id) on delete cascade,
  business_name text not null check (char_length(business_name) between 2 and 160),
  created_at timestamptz not null default now()
);

create table public.retailer_branches (
  id uuid primary key default gen_random_uuid(),
  retailer_id uuid not null references public.retailers (id) on delete cascade,
  name text not null check (char_length(name) between 2 and 120),
  address text not null check (char_length(address) between 3 and 200),
  city text not null check (char_length(city) between 2 and 80),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (retailer_id, name)
);

create table public.retailer_connections (
  retailer_id uuid not null references public.retailers (id) on delete cascade,
  manufacturer_id uuid not null references public.manufacturers (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (retailer_id, manufacturer_id)
);

create table public.cartons (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.batches (id) on delete restrict,
  carton_number text not null unique,
  -- SHA-256 (hex) of the upper-cased QR payload printed on the carton.
  qr_hash text not null unique,
  received_by_retailer uuid references public.retailers (id) on delete set null,
  received_branch uuid references public.retailer_branches (id) on delete set null,
  received_at timestamptz,
  created_at timestamptz not null default now()
);

create index cartons_batch_idx on public.cartons (batch_id);

create table public.carton_scans (
  id uuid primary key default gen_random_uuid(),
  retailer_id uuid not null references public.retailers (id) on delete cascade,
  branch_id uuid references public.retailer_branches (id) on delete set null,
  carton_id uuid references public.cartons (id) on delete set null,
  code_input text not null,
  result text not null check (result in ('safe', 'suspicious', 'recalled', 'expired')),
  reason text,
  product_name text,
  manufacturer_name text,
  batch_number text,
  carton_number text,
  received boolean not null default false,
  received_at timestamptz,
  scanned_at timestamptz not null default now()
);

create unique index carton_scans_branch_carton_result_idx
  on public.carton_scans (branch_id, carton_id, result) where carton_id is not null;
create unique index carton_scans_branch_unknown_idx
  on public.carton_scans (branch_id, code_input) where carton_id is null;
create index carton_scans_retailer_time_idx on public.carton_scans (retailer_id, scanned_at desc);

revoke all on public.retailers, public.retailer_branches, public.retailer_connections,
  public.cartons, public.carton_scans from anon, authenticated;

alter table public.retailers enable row level security;
alter table public.retailer_branches enable row level security;
alter table public.retailer_connections enable row level security;
alter table public.cartons enable row level security;
alter table public.carton_scans enable row level security;

grant select on public.retailers, public.retailer_branches, public.retailer_connections, public.carton_scans
  to authenticated;

create policy retailers_select_own on public.retailers for select to authenticated using (owner_id = auth.uid());
create policy branches_select_own on public.retailer_branches for select to authenticated
  using (retailer_id in (select id from public.retailers where owner_id = auth.uid()));
create policy connections_select_own on public.retailer_connections for select to authenticated
  using (retailer_id in (select id from public.retailers where owner_id = auth.uid()));
create policy carton_scans_select_own on public.carton_scans for select to authenticated
  using (retailer_id in (select id from public.retailers where owner_id = auth.uid()));

-- Two-factor sessions only (see 20261102080000_mfa.sql).
create policy mfa_required on public.retailers as restrictive for all to authenticated using (public.mfa_satisfied());
create policy mfa_required on public.retailer_branches as restrictive for all to authenticated using (public.mfa_satisfied());
create policy mfa_required on public.retailer_connections as restrictive for all to authenticated using (public.mfa_satisfied());
create policy mfa_required on public.carton_scans as restrictive for all to authenticated using (public.mfa_satisfied());

-- ---------------------------------------------------------------------------------------------
-- Sign-up and branches
-- ---------------------------------------------------------------------------------------------

-- Turns the signed-in account into a retailer and registers its first branch (pending approval).
create function public.register_retailer(p_business text, p_branch text, p_address text, p_city text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_retailer uuid;
begin
  if v_uid is null then raise exception 'not signed in'; end if;
  if exists (select 1 from public.retailers where owner_id = v_uid) then
    raise exception 'already a retailer';
  end if;
  if not exists (select 1 from public.profiles where id = v_uid) then
    raise exception 'no profile';
  end if;

  insert into public.retailers (owner_id, business_name) values (v_uid, btrim(p_business))
  returning id into v_retailer;
  insert into public.retailer_branches (retailer_id, name, address, city)
  values (v_retailer, btrim(p_branch), btrim(p_address), btrim(p_city));
  update public.profiles set account_type = 'retailer' where id = v_uid;
  return v_retailer;
end;
$$;

create function public.add_branch(p_name text, p_address text, p_city text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_retailer uuid;
  v_branch uuid;
begin
  select id into v_retailer from public.retailers where owner_id = auth.uid();
  if v_retailer is null then raise exception 'not a retailer'; end if;
  if (select count(*) from public.retailer_branches where retailer_id = v_retailer) >= 20 then
    raise exception 'too many branches';
  end if;
  insert into public.retailer_branches (retailer_id, name, address, city)
  values (v_retailer, btrim(p_name), btrim(p_address), btrim(p_city))
  returning id into v_branch;
  return v_branch;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Manufacturer connections (instant, no approval)
-- ---------------------------------------------------------------------------------------------

create function public.list_manufacturers()
returns table (id uuid, name text, connected boolean, connected_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select m.id, m.name, c.retailer_id is not null, c.created_at
    from public.manufacturers m
    join public.retailers r on r.owner_id = auth.uid()
    left join public.retailer_connections c on c.manufacturer_id = m.id and c.retailer_id = r.id
   order by (c.retailer_id is not null) desc, m.name;
$$;

create function public.connect_manufacturer(p_manufacturer uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_retailer uuid;
begin
  select id into v_retailer from public.retailers where owner_id = auth.uid();
  if v_retailer is null then raise exception 'not a retailer'; end if;
  insert into public.retailer_connections (retailer_id, manufacturer_id)
  select v_retailer, id from public.manufacturers where id = p_manufacturer
  on conflict do nothing;
  return true;
end;
$$;

create function public.disconnect_manufacturer(p_manufacturer uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.retailer_connections
   where manufacturer_id = p_manufacturer
     and retailer_id in (select id from public.retailers where owner_id = auth.uid());
  return true;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Scanning a carton
-- ---------------------------------------------------------------------------------------------

-- Checks a carton for an approved branch. Returns
-- {status: safe | suspicious | recalled | expired, reason, scan_id, received, carton?}.
create function public.retailer_verify_carton(p_code text, p_branch uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_retailer uuid;
  v_input text := upper(left(btrim(coalesce(p_code, '')), 64));
  v_today date := (now() at time zone 'Africa/Lagos')::date;
  r record;
  v_status text;
  v_reason text;
  v_scan uuid;
  v_received boolean := false;
  v_carton jsonb;
begin
  if v_uid is null then raise exception 'not signed in'; end if;
  select id into v_retailer from public.retailers where owner_id = v_uid;
  if v_retailer is null then raise exception 'not a retailer'; end if;
  if not exists (
    select 1 from public.retailer_branches where id = p_branch and retailer_id = v_retailer and status = 'approved'
  ) then
    raise exception 'branch not approved';
  end if;
  if v_input = '' then raise exception 'empty code'; end if;

  select c.id as carton_id, c.carton_number, c.received_by_retailer,
         b.batch_number, b.status as batch_status, b.released_at, b.expires_on, b.manufactured_on,
         p.name as product_name, p.variant, m.id as manufacturer_id, m.name as manufacturer_name
    into r
    from public.cartons c
    join public.batches b on b.id = c.batch_id
    join public.products p on p.id = b.product_id
    join public.manufacturers m on m.id = p.manufacturer_id
   where c.qr_hash = public.code_hash(v_input) or c.carton_number = v_input
   limit 1;

  if not found or r.released_at is null then
    v_status := 'suspicious';
    v_reason := 'We could not find this carton in SKANPROOV records.';
  elsif r.batch_status in ('recalled', 'revoked') then
    v_status := 'recalled';
    v_reason := r.manufacturer_name || ' recalled batch ' || r.batch_number || '.';
  elsif r.expires_on is not null and r.expires_on < v_today then
    v_status := 'expired';
    v_reason := 'This batch expired on ' || to_char(r.expires_on, 'FMDD Mon YYYY') || '.';
  elsif not exists (
    select 1 from public.retailer_connections where retailer_id = v_retailer and manufacturer_id = r.manufacturer_id
  ) then
    v_status := 'suspicious';
    v_reason := 'You are not connected to ' || r.manufacturer_name || ' yet, so we cannot confirm this carton.';
  elsif r.received_by_retailer is not null and r.received_by_retailer <> v_retailer then
    v_status := 'suspicious';
    v_reason := 'This carton was already received by another shop.';
  else
    v_status := 'safe';
    v_reason := 'This carton is registered and from a manufacturer you are connected to.';
    v_received := r.received_by_retailer = v_retailer;
  end if;

  insert into public.carton_scans (retailer_id, branch_id, carton_id, code_input, result, reason,
                                   product_name, manufacturer_name, batch_number, carton_number)
  values (v_retailer, p_branch, r.carton_id, v_input, v_status, v_reason,
          r.product_name, r.manufacturer_name, r.batch_number, r.carton_number)
  on conflict do nothing
  returning id into v_scan;

  if v_scan is null then
    select id into v_scan from public.carton_scans
     where branch_id = p_branch and result = v_status
       and ((r.carton_id is not null and carton_id = r.carton_id) or (r.carton_id is null and code_input = v_input))
     limit 1;
  end if;

  if r.carton_id is not null then
    v_carton := jsonb_build_object(
      'product', r.product_name, 'variant', r.variant, 'manufacturer', r.manufacturer_name,
      'manufacturer_id', r.manufacturer_id, 'batch_number', r.batch_number, 'carton_number', r.carton_number,
      'manufactured_on', r.manufactured_on, 'expires_on', r.expires_on
    );
  end if;

  return jsonb_build_object(
    'status', v_status, 'reason', v_reason, 'scan_id', v_scan, 'received', v_received, 'carton', v_carton
  );
end;
$$;

-- Marks a safe carton as received at the branch where it was scanned.
create function public.retailer_receive_carton(p_scan uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_retailer uuid;
  s record;
begin
  select id into v_retailer from public.retailers where owner_id = auth.uid();
  if v_retailer is null then raise exception 'not a retailer'; end if;

  select * into s from public.carton_scans
   where id = p_scan and retailer_id = v_retailer and result = 'safe' and carton_id is not null
   for update;
  if not found then return false; end if;

  update public.cartons
     set received_by_retailer = v_retailer, received_branch = s.branch_id, received_at = now()
   where id = s.carton_id and (received_by_retailer is null or received_by_retailer = v_retailer);
  if not found then return false; end if;

  update public.carton_scans set received = true, received_at = now() where id = p_scan;
  return true;
end;
$$;

-- Only signed-in people can call any of these.
revoke execute on function
  public.register_retailer(text, text, text, text), public.add_branch(text, text, text),
  public.list_manufacturers(), public.connect_manufacturer(uuid), public.disconnect_manufacturer(uuid),
  public.retailer_verify_carton(text, uuid), public.retailer_receive_carton(uuid)
  from public, anon;
grant execute on function
  public.register_retailer(text, text, text, text), public.add_branch(text, text, text),
  public.list_manufacturers(), public.connect_manufacturer(uuid), public.disconnect_manufacturer(uuid),
  public.retailer_verify_carton(text, uuid), public.retailer_receive_carton(uuid)
  to authenticated;
