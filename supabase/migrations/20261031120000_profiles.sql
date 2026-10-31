-- SKANPROOV: user profiles for consumer sign-up (Phase 1).
--
-- Credentials (e-mail + hashed password) live in Supabase's own auth.users table.
-- This table holds everything else we know about a person. One row per auth user,
-- created automatically by a trigger when someone signs up.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 120),
  -- Stored normalized, e.g. +2349034561234 (the web app normalizes before sending).
  phone text not null unique check (phone ~ '^\+234[789][01][0-9]{8}$'),
  -- Public sign-up can only ever create 'consumer'. Other types are set by an admin.
  account_type text not null default 'consumer'
    check (account_type in ('consumer', 'retailer', 'manufacturer', 'super_admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'One row per signed-up user; credentials stay in auth.users.';

-- Keep updated_at honest.
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Create the profile when a user signs up. Name and phone come from the sign-up form
-- (raw_user_meta_data). account_type is deliberately NOT read from there, so nobody
-- can make themselves a manufacturer or admin by editing the request.
-- Users created some other way (e.g. in the Supabase dashboard) need name and phone
-- metadata too, otherwise this insert is rejected by the table's checks.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone'
  );
  return new;
end;
$$;

-- Only the trigger should run this; it must not be callable through the API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row level security: a signed-in user can read and edit only their own row.
alter table public.profiles enable row level security;

create policy "Users can read their own profile"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Users can update their own profile"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Table privileges: anonymous visitors get nothing; signed-in users can read their row
-- and change only name and phone (never account_type, id or timestamps).
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, phone) on public.profiles to authenticated;
