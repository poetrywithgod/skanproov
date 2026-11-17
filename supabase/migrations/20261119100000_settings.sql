-- SKANPROOV: manufacturer portal, step 9 (Settings).
--
-- Company profile shows the details the company registered with, read only: they identify the
-- company on certificates and verification pages, so only SKANPROOV changes them. Contact details
-- are the company's own to edit: who to reach, a complaints e-mail and a website.
--
--   * New contact columns on manufacturers, filled from the registration for companies that
--     already exist.
--   * my_company(): the company profile and contact details, for any active member.
--   * update_company_contact(...): needs the manage_settings permission (Administrator); logged.
--   * audit_group() now knows the 'settings' group.

alter table public.manufacturers
  add column contact_name text check (contact_name is null or char_length(contact_name) between 2 and 120),
  add column contact_role text check (contact_role is null or char_length(contact_role) between 2 and 60),
  add column contact_phone text check (contact_phone is null or contact_phone ~ '^\+234[789][01][0-9]{8}$'),
  add column quality_email text check (quality_email is null or char_length(quality_email) between 5 and 254),
  add column website text check (website is null or (website ~* '^https?://' and char_length(website) <= 200));

-- Companies approved before this screen existed: take the contact person from their application.
update public.manufacturers m
   set contact_name = a.contact_name, contact_role = a.contact_role, contact_phone = a.contact_phone
  from public.manufacturer_members mm
  join public.manufacturer_applications a on a.user_id = mm.user_id and a.status = 'approved'
 where mm.manufacturer_id = m.id and mm.role = 'admin'
   and m.contact_name is null;

-- 1. The company, as the signed-in member sees it.
create function public.my_company()
returns table (
  name text, registered_name text, rc_number text, address text, verified_at timestamptz, created_at timestamptz,
  tin text, regulatory_number text, category text,
  contact_name text, contact_role text, contact_email text, contact_phone text, quality_email text, website text
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
    select m.name, m.registered_name, m.rc_number, m.address, m.verified_at, m.created_at,
           a.tin, a.regulatory_number, coalesce(a.category, m.categories[1]),
           m.contact_name, m.contact_role, m.contact_email, m.contact_phone, m.quality_email, m.website
      from public.manufacturers m
      left join lateral (
        select ap.tin, ap.regulatory_number, ap.category
          from public.manufacturer_members mm
          join public.manufacturer_applications ap on ap.user_id = mm.user_id and ap.status = 'approved'
         where mm.manufacturer_id = m.id and mm.role = 'admin'
         order by ap.created_at
         limit 1
      ) a on true
     where m.id = v_m;
end;
$$;

revoke execute on function public.my_company() from public, anon;
grant execute on function public.my_company() to authenticated;

-- 2. Editing the contact details. The primary e-mail is not changed here (it needs verification).
create function public.update_company_contact(
  p_name text, p_role text, p_phone text, p_quality_email text, p_website text
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_m uuid := public.require_permission('manage_settings');
  v_name text := nullif(btrim(coalesce(p_name, '')), '');
  v_role text := nullif(btrim(coalesce(p_role, '')), '');
  v_phone text := nullif(btrim(coalesce(p_phone, '')), '');
  v_quality text := nullif(btrim(coalesce(p_quality_email, '')), '');
  v_site text := nullif(btrim(coalesce(p_website, '')), '');
begin
  if v_name is null or char_length(v_name) not between 2 and 120 then raise exception 'invalid name'; end if;
  if v_role is not null and char_length(v_role) not between 2 and 60 then raise exception 'invalid role'; end if;
  if v_phone is not null and v_phone !~ '^\+234[789][01][0-9]{8}$' then raise exception 'invalid phone'; end if;
  if v_quality is not null and (v_quality !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or char_length(v_quality) > 254) then
    raise exception 'invalid quality email';
  end if;
  if v_site is not null and (v_site !~* '^https?://[^\s]+$' or char_length(v_site) > 200) then
    raise exception 'invalid website';
  end if;

  update public.manufacturers
     set contact_name = v_name, contact_role = v_role, contact_phone = v_phone,
         quality_email = lower(v_quality), website = v_site
   where id = v_m;
  perform public.add_manufacturer_activity(v_m, auth.uid(), 'settings_updated', 'Updated the company contact details');
end;
$$;

revoke execute on function public.update_company_contact(text, text, text, text, text) from public, anon;
grant execute on function public.update_company_contact(text, text, text, text, text) to authenticated;

-- 3. The audit log filter learns the new event.
create or replace function public.audit_group(p_kind text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when p_kind in ('batch_declared', 'batch_released') then 'batches'
    when p_kind in ('codes_generated', 'codes_exported') then 'codes'
    when p_kind = 'product_registered' then 'products'
    when p_kind in ('member_invited', 'invite_cancelled', 'role_changed', 'member_revoked', 'member_joined') then 'team'
    when p_kind = 'settings_updated' then 'settings'
    when p_kind = 'audit_exported' then 'audit'
    else 'other'
  end;
$$;
