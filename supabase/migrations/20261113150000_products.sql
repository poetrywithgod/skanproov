-- SKANPROOV: manufacturer portal, step 2 (products).
--
-- A manufacturer registers its products here. A product is a Draft until it has a SKU and a
-- category, and Registered once it does (decision of 13 Nov 2026: products register instantly; the
-- "pending_review" status is kept for when the Super Admin app can review them). Only registered
-- products can have batches declared and codes generated (next step).
--
-- Everything is read and written through functions that first check the caller belongs to the
-- manufacturer and, for people with two-factor on, that the code step was passed. The tables stay
-- closed to the API. Product pictures go in a public bucket (they are shown to shoppers), in a
-- folder named after the manufacturer; only members of that manufacturer can add or remove them.

-- 1. Product details from the designs.
alter table public.products
  add column product_no bigint generated always as identity,
  add column sku text check (sku is null or char_length(sku) between 2 and 40),
  add column category text check (category is null or char_length(category) between 2 and 60),
  add column brand text check (brand is null or char_length(brand) between 1 and 80),
  add column pack_size text check (pack_size is null or char_length(pack_size) between 1 and 80),
  add column description text check (description is null or char_length(description) between 1 and 200),
  add column image_path text check (image_path is null or char_length(image_path) between 1 and 300),
  add column status text not null default 'registered' check (status in ('draft', 'pending_review', 'registered')),
  add column registered_by uuid references auth.users (id) on delete set null,
  add column registered_at timestamptz,
  add column updated_at timestamptz not null default now();

alter table public.products add constraint products_variant_length check (variant is null or char_length(variant) between 1 and 80);

create unique index products_manufacturer_sku_idx on public.products (manufacturer_id, lower(sku)) where sku is not null;

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- Products that already existed (test data) count as registered when they were created.
update public.products set registered_at = created_at where registered_at is null;

-- Units in a batch, entered when the manufacturer declares it (next step). Older rows have none.
alter table public.batches add column units integer check (units is null or units between 1 and 100000000);

-- 2. Who is calling. Raises unless the caller is signed in, passed the two-factor step (if they use
--    it) and belongs to a manufacturer. Not callable from the API; the functions below use it.
create function public.current_manufacturer_id()
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v uuid;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if not public.mfa_satisfied() then raise exception 'two-factor required'; end if;
  select manufacturer_id into v from public.manufacturer_members where user_id = auth.uid();
  if v is null then raise exception 'not a manufacturer'; end if;
  return v;
end;
$$;

revoke execute on function public.current_manufacturer_id() from public, anon, authenticated;

-- Used by the storage policies below: is the signed-in person a member of this manufacturer?
create function public.is_manufacturer_member(p_manufacturer text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.mfa_satisfied()
     and exists (
       select 1 from public.manufacturer_members
        where user_id = auth.uid() and manufacturer_id::text = p_manufacturer
     );
$$;

revoke execute on function public.is_manufacturer_member(text) from public, anon;
grant execute on function public.is_manufacturer_member(text) to authenticated;

-- 3. The picture bucket: JPG, PNG or WebP, up to 2 MB, readable by anyone, writable by members.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy product_images_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_manufacturer_member((storage.foldername(name))[1]));
create policy product_images_delete on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and public.is_manufacturer_member((storage.foldername(name))[1]));

-- 4. Reading products.
create function public.my_products()
returns table (
  id uuid, product_no bigint, name text, variant text, pack_size text, description text, sku text,
  category text, brand text, nafdac_number text, image_path text, status text,
  created_at timestamptz, updated_at timestamptz, batch_count bigint
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
    select p.id, p.product_no, p.name, p.variant, p.pack_size, p.description, p.sku, p.category, p.brand,
           p.nafdac_number, p.image_path, p.status, p.created_at, p.updated_at,
           (select count(*) from public.batches b where b.product_id = p.id)
      from public.products p
     where p.manufacturer_id = v_m
     order by p.updated_at desc;
end;
$$;

create function public.my_product(p_id uuid)
returns table (
  id uuid, product_no bigint, name text, variant text, pack_size text, description text, sku text,
  category text, brand text, nafdac_number text, image_path text, status text,
  registered_at timestamptz, registered_by_name text, updated_at timestamptz
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
    select p.id, p.product_no, p.name, p.variant, p.pack_size, p.description, p.sku, p.category, p.brand,
           p.nafdac_number, p.image_path, p.status, p.registered_at, pr.full_name, p.updated_at
      from public.products p
      left join public.profiles pr on pr.id = p.registered_by
     where p.id = p_id and p.manufacturer_id = v_m;
end;
$$;

create function public.my_product_batches(p_product uuid)
returns table (
  id uuid, batch_number text, manufactured_on date, expires_on date, units integer, status text,
  released_at timestamptz, codes_generated bigint
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
    select b.id, b.batch_number, b.manufactured_on, b.expires_on, b.units, b.status, b.released_at,
           (select count(*) from public.codes c where c.batch_id = b.id)
      from public.batches b
      join public.products p on p.id = b.product_id
     where b.product_id = p_product and p.manufacturer_id = v_m
     order by b.manufactured_on desc, b.created_at desc;
end;
$$;

-- 5. Saving a product. p holds the details (the app checks them first; the table's checks are the
--    backstop). p_id is empty for a new product. Returns the product's id and the picture it
--    replaced (if any), so the app can delete the old file.
create function public.save_product(p jsonb, p_id uuid default null)
returns table (id uuid, replaced_image text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_m uuid := public.current_manufacturer_id();
  v_old public.products%rowtype;
  v_id uuid;
  v_draft boolean := coalesce((p ->> 'draft')::boolean, false);
  v_status text;
  v_sku text := nullif(btrim(coalesce(p ->> 'sku', '')), '');
  v_category text := nullif(btrim(coalesce(p ->> 'category', '')), '');
  v_image text := nullif(btrim(coalesce(p ->> 'imagePath', '')), '');
begin
  if p_id is not null then
    select * into v_old from public.products where products.id = p_id and manufacturer_id = v_m for update;
    if not found then raise exception 'no such product'; end if;
  end if;

  -- A registered product cannot go back to draft: it may already have batches.
  if v_draft and (p_id is null or v_old.status = 'draft') then
    v_status := 'draft';
  else
    if v_sku is null or v_category is null then raise exception 'incomplete'; end if;
    v_status := case when p_id is not null and v_old.status = 'pending_review' then 'pending_review' else 'registered' end;
  end if;

  -- Pictures live in the manufacturer's own folder.
  if v_image is not null and split_part(v_image, '/', 1) <> v_m::text then raise exception 'wrong folder'; end if;

  begin
    if p_id is null then
      insert into public.products (
        manufacturer_id, name, variant, pack_size, description, sku, category, brand, nafdac_number,
        image_path, status, registered_by, registered_at
      ) values (
        v_m, btrim(p ->> 'name'), nullif(btrim(coalesce(p ->> 'variant', '')), ''),
        nullif(btrim(coalesce(p ->> 'packSize', '')), ''), nullif(btrim(coalesce(p ->> 'description', '')), ''),
        v_sku, v_category, nullif(btrim(coalesce(p ->> 'brand', '')), ''),
        nullif(btrim(coalesce(p ->> 'nafdacNumber', '')), ''), v_image, v_status,
        case when v_status = 'draft' then null else auth.uid() end,
        case when v_status = 'draft' then null else now() end
      ) returning products.id into v_id;
      return query select v_id, null::text;
    else
      update public.products set
        name = btrim(p ->> 'name'),
        variant = nullif(btrim(coalesce(p ->> 'variant', '')), ''),
        pack_size = nullif(btrim(coalesce(p ->> 'packSize', '')), ''),
        description = nullif(btrim(coalesce(p ->> 'description', '')), ''),
        sku = v_sku, category = v_category,
        brand = nullif(btrim(coalesce(p ->> 'brand', '')), ''),
        nafdac_number = nullif(btrim(coalesce(p ->> 'nafdacNumber', '')), ''),
        image_path = v_image,
        status = v_status,
        registered_by = case when v_status <> 'draft' and registered_at is null then auth.uid() else registered_by end,
        registered_at = case when v_status <> 'draft' and registered_at is null then now() else registered_at end
       where products.id = p_id;
      return query select p_id,
        case when v_old.image_path is not null and v_old.image_path is distinct from v_image then v_old.image_path end;
    end if;
  exception when unique_violation then
    raise exception 'sku taken';
  end;
end;
$$;

revoke execute on function
  public.my_products(), public.my_product(uuid), public.my_product_batches(uuid), public.save_product(jsonb, uuid)
  from public, anon;
grant execute on function
  public.my_products(), public.my_product(uuid), public.my_product_batches(uuid), public.save_product(jsonb, uuid)
  to authenticated;
