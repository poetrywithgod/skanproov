-- SKANPROOV: retailer business profile (store type and RC number) and reviewed changes.
--
-- A shop's business details are what manufacturers and SKANPROOV rely on, so a retailer cannot
-- change them directly. They send a change request; a Super Admin checks it before it applies.
-- Until the Super Admin app exists, apply a request in the SQL Editor:
--
--   update public.retailers r
--      set business_name = c.business_name, store_type = c.store_type, rc_number = c.rc_number
--     from public.retailer_profile_changes c
--    where c.retailer_id = r.id and c.status = 'pending';
--   update public.retailer_profile_changes set status = 'approved', reviewed_at = now() where status = 'pending';

alter table public.retailers
  add column store_type text check (store_type is null or char_length(store_type) between 2 and 60),
  add column rc_number text check (rc_number is null or char_length(rc_number) between 3 and 20);

create table public.retailer_profile_changes (
  retailer_id uuid primary key references public.retailers (id) on delete cascade,
  business_name text not null check (char_length(business_name) between 2 and 160),
  store_type text not null check (char_length(store_type) between 2 and 60),
  rc_number text check (rc_number is null or char_length(rc_number) between 3 and 20),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  review_note text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

revoke all on public.retailer_profile_changes from anon, authenticated;
alter table public.retailer_profile_changes enable row level security;
grant select on public.retailer_profile_changes to authenticated;

create policy profile_changes_select_own on public.retailer_profile_changes for select to authenticated
  using (retailer_id in (select id from public.retailers where owner_id = auth.uid()));
create policy mfa_required on public.retailer_profile_changes as restrictive for all to authenticated
  using (public.mfa_satisfied());

-- Sends (or replaces) the shop's change request. Only one can wait at a time.
create function public.request_retailer_profile_change(p_business text, p_store_type text, p_rc text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_retailer uuid;
begin
  select id into v_retailer from public.retailers where owner_id = auth.uid();
  if v_retailer is null then raise exception 'not a retailer'; end if;

  insert into public.retailer_profile_changes (retailer_id, business_name, store_type, rc_number)
  values (v_retailer, btrim(p_business), btrim(p_store_type), nullif(btrim(coalesce(p_rc, '')), ''))
  on conflict (retailer_id) do update
    set business_name = excluded.business_name, store_type = excluded.store_type,
        rc_number = excluded.rc_number, status = 'pending', review_note = null,
        reviewed_at = null, created_at = now();
end;
$$;

revoke execute on function public.request_retailer_profile_change(text, text, text) from public, anon;
grant execute on function public.request_retailer_profile_change(text, text, text) to authenticated;
