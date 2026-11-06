-- SKANPROOV: manufacturer sign-up.
--
-- Anyone can create an account, but a manufacturer account is not created by the sign-up form.
-- The person signs up as a normal account, then submits their company details here. A Super
-- Admin checks the CAC (RC) number and approves the application; only then does a manufacturer
-- record exist. Until then the account stays a normal one and nothing about it is trusted.
--
-- Like the other tables, this one is closed to the API. People submit and read their own
-- application through functions.

create table public.manufacturer_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  company_name text not null check (char_length(company_name) between 2 and 160),
  rc_number text not null check (char_length(rc_number) between 3 and 20),
  nafdac_number text check (nafdac_number is null or char_length(nafdac_number) <= 40),
  category text not null check (char_length(category) between 2 and 80),
  address text not null check (char_length(address) between 3 and 200),
  city text not null check (char_length(city) between 2 and 80),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  review_note text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

revoke all on public.manufacturer_applications from anon, authenticated;
alter table public.manufacturer_applications enable row level security;

-- Submits the signed-in person's application. A rejected one can be sent again with corrections.
create function public.apply_manufacturer(
  p_company text, p_rc text, p_nafdac text, p_category text, p_address text, p_city text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
  v_status text;
begin
  if v_uid is null then raise exception 'not signed in'; end if;
  if not exists (select 1 from public.profiles where id = v_uid) then
    raise exception 'no profile';
  end if;

  select id, status into v_id, v_status from public.manufacturer_applications where user_id = v_uid;
  if v_id is not null and v_status <> 'rejected' then
    raise exception 'already applied';
  end if;

  if v_id is null then
    insert into public.manufacturer_applications (user_id, company_name, rc_number, nafdac_number, category, address, city)
    values (v_uid, btrim(p_company), btrim(p_rc), nullif(btrim(coalesce(p_nafdac, '')), ''), btrim(p_category), btrim(p_address), btrim(p_city))
    returning id into v_id;
  else
    update public.manufacturer_applications
       set company_name = btrim(p_company), rc_number = btrim(p_rc),
           nafdac_number = nullif(btrim(coalesce(p_nafdac, '')), ''), category = btrim(p_category),
           address = btrim(p_address), city = btrim(p_city),
           status = 'pending', review_note = null, reviewed_at = null, created_at = now()
     where id = v_id;
  end if;
  return v_id;
end;
$$;

-- The signed-in person's own application, if any.
create function public.my_manufacturer_application()
returns table (company_name text, rc_number text, category text, city text, status text, review_note text, created_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select a.company_name, a.rc_number, a.category, a.city, a.status, a.review_note, a.created_at
    from public.manufacturer_applications a
   where a.user_id = auth.uid();
$$;

revoke execute on function
  public.apply_manufacturer(text, text, text, text, text, text), public.my_manufacturer_application()
  from public, anon;
grant execute on function
  public.apply_manufacturer(text, text, text, text, text, text), public.my_manufacturer_application()
  to authenticated;
