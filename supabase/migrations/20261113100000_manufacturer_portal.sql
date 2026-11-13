-- SKANPROOV: manufacturer portal, step 1 (who belongs to which manufacturer).
--
-- Until now an approved application created nothing: there was no link between a signed-in person
-- and a manufacturer row. This adds that link, and the function that approves an application.
--
-- A person belongs to at most one manufacturer. The role column is there so team members can be
-- added later (Team Management); for now the person who applied is the manufacturer's administrator.
--
-- Like the other tables, this one is closed to the API: people read their own membership through
-- my_manufacturer(). Approving is not callable from the API at all. Until the Super Admin app
-- exists, run it by hand in the SQL Editor:
--
--   select public.approve_manufacturer_application('<application id>');

create table public.manufacturer_members (
  manufacturer_id uuid not null references public.manufacturers (id) on delete cascade,
  user_id uuid not null unique references auth.users (id) on delete cascade,
  role text not null default 'admin' check (role in ('admin', 'member')),
  created_at timestamptz not null default now(),
  primary key (manufacturer_id, user_id)
);

revoke all on public.manufacturer_members from anon, authenticated;
alter table public.manufacturer_members enable row level security;
create policy mfa_required on public.manufacturer_members as restrictive for all to authenticated using (public.mfa_satisfied());

-- The signed-in person's manufacturer, or no rows if they are not a member of one.
create function public.my_manufacturer()
returns table (id uuid, name text, role text, verified boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select m.id, m.name, mm.role, m.verified_at is not null
    from public.manufacturer_members mm
    join public.manufacturers m on m.id = mm.manufacturer_id
   where mm.user_id = auth.uid();
$$;

revoke execute on function public.my_manufacturer() from public, anon;
grant execute on function public.my_manufacturer() to authenticated;

-- Approves a pending application: creates the manufacturer from the details the company gave,
-- makes the applicant its administrator and turns their account into a manufacturer account.
-- Returns the new manufacturer's id. Not callable from the API (SQL Editor and the future Super Admin only).
create function public.approve_manufacturer_application(p_application uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  a public.manufacturer_applications%rowtype;
  v_manufacturer uuid;
begin
  select * into a from public.manufacturer_applications where id = p_application for update;
  if not found then raise exception 'no such application'; end if;
  if a.status <> 'pending' then raise exception 'application is %, not pending', a.status; end if;
  if exists (select 1 from public.manufacturer_members where user_id = a.user_id) then
    raise exception 'this person already belongs to a manufacturer';
  end if;

  insert into public.manufacturers (name, registered_name, rc_number, address, contact_email, categories, verified_at)
  values (
    a.company_name,
    a.company_name,
    a.rc_number,
    concat_ws(', ', a.address, a.city, a.state),
    a.company_email,
    array[a.category],
    now()
  )
  returning id into v_manufacturer;

  insert into public.manufacturer_members (manufacturer_id, user_id, role)
  values (v_manufacturer, a.user_id, 'admin');

  update public.profiles set account_type = 'manufacturer' where id = a.user_id;
  update public.manufacturer_applications
     set status = 'approved', reviewed_at = now(), review_note = null
   where id = a.id;

  return v_manufacturer;
end;
$$;

revoke execute on function public.approve_manufacturer_application(uuid) from public, anon, authenticated;
