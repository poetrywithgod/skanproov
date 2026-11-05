-- TEST DATA ONLY. Run in a development Supabase project after seed.sql, never in production.
-- Gives the retailer app cartons to scan. All names and codes are made up.
--
--   CARTON-DEMO-1 .. CARTON-DEMO-3   cartons from a connected-able manufacturer (Dufil), safe to receive
--   CARTON-RECALLED                  carton from a recalled batch
--   CARTON-EXPIRED                   carton from an expired batch
--   CARTON-DELTA-1                   carton from Delta Pure Oils (not connected until you connect it)
--   anything else                    "not found" (suspicious)
--
-- To approve a branch while there is no Super Admin app yet, run:
--   update public.retailer_branches set status = 'approved', reviewed_at = now() where status = 'pending';

insert into public.manufacturers (name) values ('Delta Pure Oils') on conflict (name) do nothing;

with m as (select id from public.manufacturers where name = 'Delta Pure Oils'),
p as (
  insert into public.products (manufacturer_id, name, variant, nafdac_number, points_per_scan)
  select id, 'Cooking oil, 5L carton', null, 'NAFDAC/TEST/000002', 50 from m
  returning id
)
insert into public.batches (product_id, batch_number, manufactured_on, expires_on, status, released_at)
select id, 'BT-DP-5521', '2026-09-20', '2027-09-20', 'active', now() from p
on conflict do nothing;

insert into public.cartons (batch_id, carton_number, qr_hash)
select b.id, v.carton, public.code_hash(v.qr)
from public.batches b
join (values
  ('IND-TEST-261001', 'CT-DEMO-0001', 'CARTON-DEMO-1'),
  ('IND-TEST-261001', 'CT-DEMO-0002', 'CARTON-DEMO-2'),
  ('IND-TEST-261001', 'CT-DEMO-0003', 'CARTON-DEMO-3'),
  ('IND-TEST-RECALL', 'CT-DEMO-0004', 'CARTON-RECALLED'),
  ('IND-TEST-OLD',    'CT-DEMO-0005', 'CARTON-EXPIRED'),
  ('BT-DP-5521',      'CT-DEMO-0006', 'CARTON-DELTA-1')
) as v(batch, carton, qr) on v.batch = b.batch_number
on conflict do nothing;

-- Manufacturer profiles for the Manufacturers screens. Safe to run again: it updates what it inserted.
insert into public.manufacturers (name, registered_name, rc_number, address, contact_email, categories, brands, verified_at)
values
  ('Sunvale Beverages', 'Sunvale Beverages Nigeria Ltd', 'RC 1048823', 'Plot 14, Agbara Industrial Estate, Ogun',
   'retail@sunvale.ng', '{Beverages,Dairy}', '{"Sunvale Malt","Choco Gold"}', now()),
  ('Delta Pure Oils', 'Delta Pure Oils Nigeria Ltd', 'RC 774120', '22 Warri-Sapele Road, Warri, Delta',
   'trade@deltapure.ng', '{"Edible oils","Cooking oils"}', '{"Delta Pure"}', now()),
  ('Harvest Gold Oils', 'Harvest Gold Processing Co.', 'RC 902311', '5 Trans-Amadi Industrial Layout, Port Harcourt',
   'trade@harvestgold.ng', '{"Cooking oils"}', '{"Harvest Gold"}', now()),
  ('Lagoon Confectionery', 'Lagoon Confectionery Ltd', 'RC 655908', '9 Creek Road, Apapa, Lagos',
   'sales@lagoonconf.ng', '{Snacks,Confectionery}', '{"Lagoon Treats"}', now()),
  ('Brightway Household', 'Brightway Household Products Ltd', null, null, null, '{"Household goods"}', '{}', null)
on conflict (name) do update set
  registered_name = excluded.registered_name, rc_number = excluded.rc_number, address = excluded.address,
  contact_email = excluded.contact_email, categories = excluded.categories, brands = excluded.brands,
  verified_at = excluded.verified_at;

update public.manufacturers
   set registered_name = 'Dufil Prima Foods Plc', categories = '{Noodles,Food}', brands = '{Indomie}'
 where name = 'Dufil Prima Foods Ltd.' and registered_name is null;
