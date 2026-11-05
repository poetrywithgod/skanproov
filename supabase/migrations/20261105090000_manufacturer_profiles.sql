-- SKANPROOV: manufacturer profiles for the retailer app (Phase 1).
--
-- A retailer needs enough detail to be sure they are connecting to the right company: registered
-- name, RC number, address, categories, brands and a trade contact. These are filled in by SKANPROOV
-- (and later by the Super Admin app) when a manufacturer is onboarded.
--
-- "verified_at" is set only after SKANPROOV has checked the business. The retailer app shows
-- "Business verified by SkanProof" only when it is set.
--
-- The tables stay closed to the API: retailers read manufacturers only through the two functions below.
-- Connecting is instant and needs no approval (decision of 22 Oct 2026); nothing here changes that.

alter table public.manufacturers
  add column registered_name text check (registered_name is null or char_length(registered_name) between 2 and 200),
  add column rc_number text check (rc_number is null or char_length(rc_number) between 2 and 40),
  add column address text check (address is null or char_length(address) between 3 and 300),
  add column contact_email text check (contact_email is null or char_length(contact_email) between 5 and 200),
  add column categories text[] not null default '{}' check (cardinality(categories) <= 12),
  add column brands text[] not null default '{}' check (cardinality(brands) <= 30),
  add column verified_at timestamptz;

-- The list now also returns categories and whether the business is verified, so the return type changes.
drop function public.list_manufacturers();

create function public.list_manufacturers()
returns table (
  id uuid,
  name text,
  categories text[],
  verified boolean,
  connected boolean,
  connected_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select m.id, m.name, m.categories, m.verified_at is not null,
         c.retailer_id is not null, c.created_at
    from public.manufacturers m
    join public.retailers r on r.owner_id = auth.uid()
    left join public.retailer_connections c on c.manufacturer_id = m.id and c.retailer_id = r.id
   order by m.name;
$$;

-- One manufacturer's profile, for a registered retailer. No rows for anyone else.
create function public.get_manufacturer(p_manufacturer uuid)
returns table (
  id uuid,
  name text,
  registered_name text,
  rc_number text,
  address text,
  categories text[],
  brands text[],
  contact_email text,
  verified boolean,
  connected boolean,
  connected_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select m.id, m.name, m.registered_name, m.rc_number, m.address, m.categories, m.brands,
         m.contact_email, m.verified_at is not null, c.retailer_id is not null, c.created_at
    from public.manufacturers m
    join public.retailers r on r.owner_id = auth.uid()
    left join public.retailer_connections c on c.manufacturer_id = m.id and c.retailer_id = r.id
   where m.id = p_manufacturer;
$$;

revoke execute on function public.list_manufacturers(), public.get_manufacturer(uuid) from public, anon;
grant execute on function public.list_manufacturers(), public.get_manufacturer(uuid) to authenticated;
