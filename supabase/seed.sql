-- TEST DATA ONLY. Run in a development Supabase project, never in production.
-- Run it once. Gives the scanner something real to verify. All names, numbers and codes below are made up.
--
--   123456789012     12-digit backup PIN for the first sample carton
--   DEMO-GENUINE     QR payload for the same carton
--   DEMO-GENUINE-2 ... DEMO-GENUINE-5   more unscanned cartons (to test points and duplicates)
--   DEMO-RECALLED    carton from a recalled batch
--   DEMO-EXPIRED     carton from an expired batch
--   DEMO-UNRELEASED  carton from a batch that has not been released

insert into public.manufacturers (name) values ('Dufil Prima Foods Ltd.') on conflict (name) do nothing;

with m as (select id from public.manufacturers where name = 'Dufil Prima Foods Ltd.'),
p as (
  insert into public.products (manufacturer_id, name, variant, nafdac_number, points_per_scan)
  select id, 'Indomie Instant Noodles', 'Chicken Flavour', 'NAFDAC/TEST/000001', 50 from m
  returning id
),
b as (
  insert into public.batches (product_id, batch_number, manufactured_on, expires_on, status, released_at)
  select id, v.batch, v.mfg::date, v.exp::date, v.status, v.released::timestamptz
  from p, (values
    ('IND-TEST-261001', '2026-10-01', '2027-10-01', 'active',   now()::text),
    ('IND-TEST-RECALL', '2026-09-01', '2027-09-01', 'recalled', now()::text),
    ('IND-TEST-OLD',    '2025-01-01', '2025-12-31', 'active',   now()::text),
    ('IND-TEST-HOLD',   '2026-10-15', '2027-10-15', 'active',   null)
  ) as v(batch, mfg, exp, status, released)
  returning id, batch_number
)
insert into public.codes (batch_id, qr_hash, pin_hash)
select b.id, public.code_hash(c.qr), c.pin
from b
join (values
  ('IND-TEST-261001', 'DEMO-GENUINE',   public.code_hash('123456789012')),
  ('IND-TEST-261001', 'DEMO-GENUINE-2', public.code_hash('234567890123')),
  ('IND-TEST-261001', 'DEMO-GENUINE-3', public.code_hash('345678901234')),
  ('IND-TEST-261001', 'DEMO-GENUINE-4', public.code_hash('456789012345')),
  ('IND-TEST-261001', 'DEMO-GENUINE-5', public.code_hash('567890123456')),
  ('IND-TEST-RECALL', 'DEMO-RECALLED',  public.code_hash('678901234567')),
  ('IND-TEST-OLD',    'DEMO-EXPIRED',   public.code_hash('789012345678')),
  ('IND-TEST-HOLD',   'DEMO-UNRELEASED', public.code_hash('890123456789'))
) as c(batch, qr, pin) on c.batch = b.batch_number
on conflict do nothing;
