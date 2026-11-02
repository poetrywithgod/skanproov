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
