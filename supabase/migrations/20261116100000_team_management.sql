-- SKANPROOV: manufacturer portal, step 6 (Team Management).
--
-- Until now everyone in a manufacturer was either 'admin' or 'member', and the role changed nothing.
-- This adds the four roles from the design (Administrator, Code Manager, Compliance Officer, Viewer)
-- and makes them count: every action in the portal now checks what the caller's role allows, in the
-- database, so a screen that hides a button is never the only protection.
--
-- What each role can do (the design's list of eleven permissions):
--   Administrator       everything
--   Code Manager        declare batches, generate codes, export and print codes, view audit logs
--   Compliance Officer  release batches, recall and revoke codes, view and export audit logs
--                       (the design lists only the Code Manager's ticks; the Compliance Officer's are
--                        read from its description and should be confirmed)
--   Viewer              read-only: products, batches and notifications
--
-- People join by invitation. An administrator enters a name, e-mail and role; the app makes a one-time
-- link, which the administrator sends to the person. Only a fingerprint (SHA-256) of the link is kept.
-- The person signs in (or creates an account) with that same e-mail and opens the link to join.
-- Links last 14 days. A person belongs to at most one manufacturer.
--
-- Revoking access keeps the person's row (status 'revoked') so their past activity still has a name;
-- they lose access at once, because every function checks the status.
--
-- A new activity log records what people do (declared a batch, generated codes, invited someone...).
-- It feeds the member panel now and the Audit Logs screen later. Only things that happen are logged.
--
-- The existing functions keep working as they are: each is renamed to "<name>_core" (not callable
-- from the API) and a new function with the old name checks the permission, calls the core and logs
-- the activity.

-- 1. Roles and member status.
alter table public.manufacturer_members drop constraint manufacturer_members_role_check;
update public.manufacturer_members set role = 'viewer' where role = 'member';
alter table public.manufacturer_members
  add constraint manufacturer_members_role_check
  check (role in ('admin', 'code_manager', 'compliance_officer', 'viewer'));

alter table public.manufacturer_members
  add column status text not null default 'active' check (status in ('active', 'revoked')),
  add column invited_by uuid references auth.users (id) on delete set null,
  add column invited_at timestamptz,
  add column revoked_at timestamptz,
  add column last_seen_at timestamptz;

-- 2. What a role may do. Internal; the app reads the table below through permission_matrix().
create function public.all_permissions()
returns text[]
language sql
immutable
set search_path = ''
as $$
  select array[
    'manage_products', 'declare_batches', 'generate_codes', 'export_codes', 'release_batches',
    'recall_codes', 'view_audit_logs', 'export_audit_logs', 'manage_team', 'manage_settings', 'manage_billing'
  ];
$$;

create function public.role_can(p_role text, p_permission text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case p_role
    when 'admin' then p_permission = any (public.all_permissions())
    when 'code_manager' then p_permission in ('declare_batches', 'generate_codes', 'export_codes', 'view_audit_logs')
    when 'compliance_officer' then p_permission in ('release_batches', 'recall_codes', 'view_audit_logs', 'export_audit_logs')
    else false
  end;
$$;

create function public.role_label(p_role text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case p_role
    when 'admin' then 'Administrator'
    when 'code_manager' then 'Code Manager'
    when 'compliance_officer' then 'Compliance Officer'
    when 'viewer' then 'Viewer'
    else p_role
  end;
$$;

revoke execute on function public.all_permissions(), public.role_can(text, text), public.role_label(text)
  from public, anon, authenticated;

-- 3. Who is calling, and may they do this? Raises unless the caller is a signed-in, active member
--    (who passed the two-factor step) whose role has the permission - or the second one, if given.
--    Returns the manufacturer's id. Not callable from the API.
create function public.require_permission(p_permission text, p_or text default null)
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_m uuid := public.current_manufacturer_id();
  v_role text;
begin
  select role into v_role from public.manufacturer_members where user_id = auth.uid();
  if not (public.role_can(v_role, p_permission) or (p_or is not null and public.role_can(v_role, p_or))) then
    raise exception 'not allowed';
  end if;
  return v_m;
end;
$$;

revoke execute on function public.require_permission(text, text) from public, anon, authenticated;

-- Active members only. Used by the storage policies.
create or replace function public.is_manufacturer_member(p_manufacturer text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.mfa_satisfied()
     and exists (
       select 1 from public.manufacturer_members
        where user_id = auth.uid() and manufacturer_id::text = p_manufacturer and status = 'active'
     );
$$;

create function public.member_can(p_manufacturer text, p_permission text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.mfa_satisfied()
     and exists (
       select 1 from public.manufacturer_members
        where user_id = auth.uid() and manufacturer_id::text = p_manufacturer and status = 'active'
          and public.role_can(role, p_permission)
     );
$$;

revoke execute on function public.member_can(text, text) from public, anon;
grant execute on function public.member_can(text, text) to authenticated;

-- A revoked person is no longer a member for any function.
create or replace function public.current_manufacturer_id()
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
  select manufacturer_id into v from public.manufacturer_members where user_id = auth.uid() and status = 'active';
  if v is null then raise exception 'not a manufacturer'; end if;
  return v;
end;
$$;

-- 4. The signed-in person's membership, now with status and what their role allows. A revoked
--    person still gets a row (status 'revoked') so the app can tell them, instead of sending them
--    to register a company.
drop function public.my_manufacturer();
create function public.my_manufacturer()
returns table (id uuid, name text, role text, verified boolean, status text, permissions text[])
language sql
stable
security definer
set search_path = ''
as $$
  select m.id, m.name, mm.role, m.verified_at is not null, mm.status,
         case when mm.status = 'active'
              then array(select pm from unnest(public.all_permissions()) pm where public.role_can(mm.role, pm))
              else '{}'::text[] end
    from public.manufacturer_members mm
    join public.manufacturers m on m.id = mm.manufacturer_id
   where mm.user_id = auth.uid();
$$;

revoke execute on function public.my_manufacturer() from public, anon;
grant execute on function public.my_manufacturer() to authenticated;

-- The table of roles and permissions, for the Roles & permissions tab and the member panel.
create function public.permission_matrix()
returns table (role text, permission text)
language sql
stable
security definer
set search_path = ''
as $$
  select r, pm
    from unnest(array['admin', 'code_manager', 'compliance_officer', 'viewer']) r,
         unnest(public.all_permissions()) pm
   where public.role_can(r, pm);
$$;

revoke execute on function public.permission_matrix() from public, anon;
grant execute on function public.permission_matrix() to authenticated;

-- Remembers when a member was last in the portal (at most every five minutes).
create function public.touch_member_seen()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.mfa_satisfied() then return; end if;
  update public.manufacturer_members
     set last_seen_at = now()
   where user_id = auth.uid() and status = 'active'
     and (last_seen_at is null or last_seen_at < now() - interval '5 minutes');
end;
$$;

revoke execute on function public.touch_member_seen() from public, anon;
grant execute on function public.touch_member_seen() to authenticated;

-- 5. The activity log. Closed to the API like the other tables.
create table public.manufacturer_activity (
  id uuid primary key default gen_random_uuid(),
  manufacturer_id uuid not null references public.manufacturers (id) on delete cascade,
  actor_id uuid references auth.users (id) on delete set null,
  kind text not null check (char_length(kind) between 1 and 40),
  summary text not null check (char_length(summary) between 1 and 200),
  ref_label text check (ref_label is null or char_length(ref_label) between 1 and 80),
  created_at timestamptz not null default now()
);

create index manufacturer_activity_manufacturer_idx on public.manufacturer_activity (manufacturer_id, created_at desc);
create index manufacturer_activity_actor_idx on public.manufacturer_activity (actor_id, created_at desc);

revoke all on public.manufacturer_activity from anon, authenticated;
alter table public.manufacturer_activity enable row level security;
create policy mfa_required on public.manufacturer_activity as restrictive for all to authenticated using (public.mfa_satisfied());

create function public.add_manufacturer_activity(
  p_manufacturer uuid, p_actor uuid, p_kind text, p_summary text, p_ref text default null
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.manufacturer_activity (manufacturer_id, actor_id, kind, summary, ref_label)
  values (p_manufacturer, p_actor, p_kind, left(p_summary, 200), p_ref);
$$;

revoke execute on function public.add_manufacturer_activity(uuid, uuid, text, text, text) from public, anon, authenticated;

-- 6. Invitations.
create table public.manufacturer_invites (
  id uuid primary key default gen_random_uuid(),
  manufacturer_id uuid not null references public.manufacturers (id) on delete cascade,
  email text not null check (email = lower(email) and char_length(email) between 5 and 254),
  full_name text not null check (char_length(full_name) between 2 and 120),
  role text not null check (role in ('admin', 'code_manager', 'compliance_officer', 'viewer')),
  token_hash text not null unique,
  invited_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  accepted_by uuid references auth.users (id) on delete set null,
  cancelled_at timestamptz
);

-- One open invitation per e-mail per manufacturer.
create unique index manufacturer_invites_open_idx
  on public.manufacturer_invites (manufacturer_id, email)
  where accepted_at is null and cancelled_at is null;

revoke all on public.manufacturer_invites from anon, authenticated;
alter table public.manufacturer_invites enable row level security;
create policy mfa_required on public.manufacturer_invites as restrictive for all to authenticated using (public.mfa_satisfied());

-- 7. Reading the team (Team Management only). One row per member and per open invitation.
--    key is the person's user id for a member and the invitation's id for an invitation.
create function public.team_overview()
returns table (
  key uuid, kind text, full_name text, email text, role text, status text,
  last_seen_at timestamptz, invited_at timestamptz, expires_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_m uuid := public.require_permission('manage_team');
begin
  return query
    select x.key, x.kind, x.full_name, x.email, x.role, x.status, x.last_seen_at, x.invited_at, x.expires_at
      from (
        select mm.user_id as key, 'member'::text as kind, pr.full_name, u.email::text as email, mm.role, mm.status,
               mm.last_seen_at, mm.invited_at, null::timestamptz as expires_at
          from public.manufacturer_members mm
          left join public.profiles pr on pr.id = mm.user_id
          left join auth.users u on u.id = mm.user_id
         where mm.manufacturer_id = v_m
        union all
        select i.id, 'invite'::text, i.full_name, i.email, i.role,
               case when i.expires_at > now() then 'pending' else 'expired' end,
               null::timestamptz, i.created_at, i.expires_at
          from public.manufacturer_invites i
         where i.manufacturer_id = v_m and i.accepted_at is null and i.cancelled_at is null
      ) x
     order by case x.status when 'active' then 0 when 'pending' then 1 when 'expired' then 2 else 3 end,
              x.full_name;
end;
$$;

-- One person's details and their latest activity (Team Management only).
-- p_kind is 'member' or 'invite'; p_key as in team_overview().
create function public.team_member_detail(p_kind text, p_key uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_m uuid := public.require_permission('manage_team');
  v jsonb;
begin
  if p_kind = 'member' then
    select jsonb_build_object(
             'kind', 'member', 'key', mm.user_id, 'fullName', pr.full_name, 'email', u.email, 'phone', pr.phone,
             'role', mm.role, 'status', mm.status, 'lastSeenAt', mm.last_seen_at,
             'invitedAt', mm.invited_at, 'invitedByName', ib.full_name, 'joinedAt', mm.created_at,
             'revokedAt', mm.revoked_at,
             'twoFactor', exists (select 1 from auth.mfa_factors f where f.user_id = mm.user_id and f.status = 'verified'),
             'activity', coalesce((
               select jsonb_agg(jsonb_build_object('summary', a.summary, 'createdAt', a.created_at) order by a.created_at desc)
                 from (
                   select summary, created_at from public.manufacturer_activity
                    where manufacturer_id = v_m and actor_id = mm.user_id
                    order by created_at desc limit 4
                 ) a
             ), '[]'::jsonb)
           )
      into v
      from public.manufacturer_members mm
      left join public.profiles pr on pr.id = mm.user_id
      left join auth.users u on u.id = mm.user_id
      left join public.profiles ib on ib.id = mm.invited_by
     where mm.manufacturer_id = v_m and mm.user_id = p_key;
  elsif p_kind = 'invite' then
    select jsonb_build_object(
             'kind', 'invite', 'key', i.id, 'fullName', i.full_name, 'email', i.email, 'role', i.role,
             'status', case when i.expires_at > now() then 'pending' else 'expired' end,
             'invitedAt', i.created_at, 'invitedByName', ib.full_name, 'expiresAt', i.expires_at,
             'activity', '[]'::jsonb
           )
      into v
      from public.manufacturer_invites i
      left join public.profiles ib on ib.id = i.invited_by
     where i.manufacturer_id = v_m and i.id = p_key and i.accepted_at is null and i.cancelled_at is null;
  end if;
  if v is null then raise exception 'no such person'; end if;
  return v;
end;
$$;

-- 8. Inviting. Returns the invitation's id and the readable link token, shown once: only its
--    fingerprint is stored. Inviting someone whose access was revoked brings them back when they accept.
create function public.invite_member(p_name text, p_email text, p_role text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_m uuid := public.require_permission('manage_team');
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_name text := btrim(coalesce(p_name, ''));
  v_token text := encode(extensions.gen_random_bytes(24), 'hex');
  v_id uuid;
  v_user uuid;
  v_member public.manufacturer_members%rowtype;
begin
  if char_length(v_name) < 2 or char_length(v_name) > 120 then raise exception 'bad name'; end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or char_length(v_email) > 254 then raise exception 'bad email'; end if;
  if p_role is null or p_role not in ('admin', 'code_manager', 'compliance_officer', 'viewer') then raise exception 'bad role'; end if;

  -- Already in the team (or in another one)?
  select u.id into v_user from auth.users u where lower(u.email) = v_email;
  if v_user is not null then
    select * into v_member from public.manufacturer_members where user_id = v_user;
    if found then
      if v_member.manufacturer_id <> v_m or v_member.status = 'active' then raise exception 'cannot invite'; end if;
    end if;
  end if;

  -- An old invitation that ran out no longer blocks a new one.
  update public.manufacturer_invites
     set cancelled_at = now()
   where manufacturer_id = v_m and email = v_email
     and accepted_at is null and cancelled_at is null and expires_at <= now();

  begin
    insert into public.manufacturer_invites (manufacturer_id, email, full_name, role, token_hash, invited_by, expires_at)
    values (v_m, v_email, v_name, p_role, encode(extensions.digest(v_token, 'sha256'), 'hex'), auth.uid(), now() + interval '14 days')
    returning id into v_id;
  exception when unique_violation then
    raise exception 'already invited';
  end;

  perform public.add_manufacturer_activity(v_m, auth.uid(), 'member_invited',
    format('Invited %s as %s', v_name, public.role_label(p_role)));
  return jsonb_build_object('id', v_id, 'token', v_token);
end;
$$;

-- A fresh link for an open invitation (the old link stops working). Also extends it by 14 days.
create function public.reissue_invite(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_m uuid := public.require_permission('manage_team');
  v_token text := encode(extensions.gen_random_bytes(24), 'hex');
begin
  update public.manufacturer_invites
     set token_hash = encode(extensions.digest(v_token, 'sha256'), 'hex'), expires_at = now() + interval '14 days'
   where id = p_id and manufacturer_id = v_m and accepted_at is null and cancelled_at is null;
  if not found then raise exception 'no such invite'; end if;
  return jsonb_build_object('id', p_id, 'token', v_token);
end;
$$;

create function public.cancel_invite(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_m uuid := public.require_permission('manage_team');
  v_name text;
begin
  update public.manufacturer_invites
     set cancelled_at = now()
   where id = p_id and manufacturer_id = v_m and accepted_at is null and cancelled_at is null
  returning full_name into v_name;
  if not found then raise exception 'no such invite'; end if;
  perform public.add_manufacturer_activity(v_m, auth.uid(), 'invite_cancelled', format('Cancelled the invitation for %s', v_name));
end;
$$;

-- 9. Changing a role and revoking access. Nobody can do either to themselves, which also keeps at
--    least one administrator in the company.
create function public.change_member_role(p_user uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_m uuid := public.require_permission('manage_team');
  v_old text;
  v_name text;
begin
  if p_role is null or p_role not in ('admin', 'code_manager', 'compliance_officer', 'viewer') then raise exception 'bad role'; end if;
  if p_user = auth.uid() then raise exception 'not yourself'; end if;

  select mm.role, pr.full_name into v_old, v_name
    from public.manufacturer_members mm
    left join public.profiles pr on pr.id = mm.user_id
   where mm.user_id = p_user and mm.manufacturer_id = v_m and mm.status = 'active'
     for update of mm;
  if not found then raise exception 'no such member'; end if;
  if v_old = p_role then return; end if;

  update public.manufacturer_members set role = p_role where user_id = p_user;
  perform public.add_manufacturer_activity(v_m, auth.uid(), 'role_changed',
    format('Changed %s''s role from %s to %s', v_name, public.role_label(v_old), public.role_label(p_role)));
end;
$$;

create function public.revoke_member(p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_m uuid := public.require_permission('manage_team');
  v_name text;
begin
  if p_user = auth.uid() then raise exception 'not yourself'; end if;

  update public.manufacturer_members mm
     set status = 'revoked', revoked_at = now()
   where mm.user_id = p_user and mm.manufacturer_id = v_m and mm.status = 'active';
  if not found then raise exception 'no such member'; end if;

  select full_name into v_name from public.profiles where id = p_user;
  perform public.add_manufacturer_activity(v_m, auth.uid(), 'member_revoked', format('Revoked %s''s access', v_name));
  perform public.add_manufacturer_notification(v_m, 'account', 'member_revoked', 'Team access revoked',
    format('%s no longer has access to the portal.', v_name), v_name, '/manufacturer/team', 'Open Team Management');
end;
$$;

revoke execute on function
  public.team_overview(), public.team_member_detail(text, uuid), public.invite_member(text, text, text),
  public.reissue_invite(uuid), public.cancel_invite(uuid), public.change_member_role(uuid, text),
  public.revoke_member(uuid)
  from public, anon;
grant execute on function
  public.team_overview(), public.team_member_detail(text, uuid), public.invite_member(text, text, text),
  public.reissue_invite(uuid), public.cancel_invite(uuid), public.change_member_role(uuid, text),
  public.revoke_member(uuid)
  to authenticated;

-- 10. Joining. The invitation page shows who invited the person before they sign in: the link is
--     the secret. Returns nothing for an unknown link.
create function public.invite_preview(p_token text)
returns table (company text, role text, email text, full_name text, state text)
language sql
stable
security definer
set search_path = ''
as $$
  select m.name, i.role, i.email, i.full_name,
         case when i.accepted_at is not null then 'used'
              when i.cancelled_at is not null then 'cancelled'
              when i.expires_at <= now() then 'expired'
              else 'valid' end
    from public.manufacturer_invites i
    join public.manufacturers m on m.id = i.manufacturer_id
   where i.token_hash = encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex');
$$;

revoke execute on function public.invite_preview(text) from public;
grant execute on function public.invite_preview(text) to anon, authenticated;

-- Accepting: the caller must be signed in with the e-mail the invitation was sent to (Supabase
-- only signs people in after they confirmed that e-mail). Returns the manufacturer's id.
create function public.accept_manufacturer_invite(p_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  i public.manufacturer_invites%rowtype;
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_member public.manufacturer_members%rowtype;
  v_type text;
  v_name text;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if not public.mfa_satisfied() then raise exception 'two-factor required'; end if;

  select * into i from public.manufacturer_invites
   where token_hash = encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex')
     for update;
  if not found then raise exception 'no such invite'; end if;
  if i.accepted_at is not null or i.cancelled_at is not null then raise exception 'invite used'; end if;
  if i.expires_at <= now() then raise exception 'invite expired'; end if;
  if v_email = '' or v_email <> i.email then raise exception 'wrong email'; end if;

  select account_type, full_name into v_type, v_name from public.profiles where id = auth.uid();
  if v_type is null then raise exception 'no profile'; end if;
  if v_type in ('retailer', 'super_admin') then raise exception 'wrong account type'; end if;

  select * into v_member from public.manufacturer_members where user_id = auth.uid() for update;
  if found then
    if v_member.manufacturer_id <> i.manufacturer_id or v_member.status = 'active' then raise exception 'already a member'; end if;
    update public.manufacturer_members
       set status = 'active', revoked_at = null, role = i.role, invited_by = i.invited_by, invited_at = i.created_at
     where user_id = auth.uid();
  else
    insert into public.manufacturer_members (manufacturer_id, user_id, role, invited_by, invited_at)
    values (i.manufacturer_id, auth.uid(), i.role, i.invited_by, i.created_at);
  end if;

  update public.profiles set account_type = 'manufacturer' where id = auth.uid();
  update public.manufacturer_invites set accepted_at = now(), accepted_by = auth.uid() where id = i.id;

  perform public.add_manufacturer_activity(i.manufacturer_id, auth.uid(), 'member_joined',
    format('Joined the team as %s', public.role_label(i.role)));
  perform public.add_manufacturer_notification(i.manufacturer_id, 'account', 'member_joined', 'New team member',
    format('%s joined the team as %s.', v_name, public.role_label(i.role)), v_name, '/manufacturer/team', 'Open Team Management');
  return i.manufacturer_id;
end;
$$;

revoke execute on function public.accept_manufacturer_invite(text) from public, anon;
grant execute on function public.accept_manufacturer_invite(text) to authenticated;

-- 11. Enforcing roles on the existing actions. Each existing function becomes "<name>_core" and a
--     function with the old name checks the permission first. Reading stays open to every member.

-- Products: manage_products.
alter function public.save_product(jsonb, uuid) rename to save_product_core;
revoke execute on function public.save_product_core(jsonb, uuid) from public, anon, authenticated;

create function public.save_product(p jsonb, p_id uuid default null)
returns table (id uuid, replaced_image text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_m uuid := public.require_permission('manage_products');
  v_id uuid;
  v_old text;
  v_name text;
begin
  select c.id, c.replaced_image into v_id, v_old from public.save_product_core(p, p_id) c;
  -- Logged only when this call is what registered the product (now() is the same all through a call).
  select pd.name into v_name from public.products pd where pd.id = v_id and pd.registered_at = now();
  if v_name is not null then
    perform public.add_manufacturer_activity(v_m, auth.uid(), 'product_registered', format('Registered product %s', v_name), v_name);
  end if;
  return query select v_id, v_old;
end;
$$;

-- Batches: declare_batches, release_batches.
alter function public.declare_batch(jsonb) rename to declare_batch_core;
revoke execute on function public.declare_batch_core(jsonb) from public, anon, authenticated;

create function public.declare_batch(p jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_m uuid := public.require_permission('declare_batches');
  v_id uuid;
  v_no text;
  v_units integer;
begin
  v_id := public.declare_batch_core(p);
  select b.batch_number, b.units into v_no, v_units from public.batches b where b.id = v_id;
  perform public.add_manufacturer_activity(v_m, auth.uid(), 'batch_declared',
    format('Declared batch %s (%s units)', v_no, to_char(v_units, 'FM999,999,999,999')), v_no);
  return v_id;
end;
$$;

alter function public.release_batch(uuid) rename to release_batch_core;
revoke execute on function public.release_batch_core(uuid) from public, anon, authenticated;

create function public.release_batch(p_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_m uuid := public.require_permission('release_batches');
  v_before timestamptz;
  v_at timestamptz;
  v_no text;
begin
  select b.released_at, b.batch_number into v_before, v_no from public.batches b where b.id = p_id;
  v_at := public.release_batch_core(p_id);
  -- Releasing twice is harmless and is not logged twice.
  if v_before is null then
    perform public.add_manufacturer_activity(v_m, auth.uid(), 'batch_released', format('Released batch %s', v_no), v_no);
  end if;
  return v_at;
end;
$$;

-- Codes: generate_codes to make them, export_codes to read the files.
alter function public.generate_codes(uuid, integer) rename to generate_codes_core;
revoke execute on function public.generate_codes_core(uuid, integer) from public, anon, authenticated;

create function public.generate_codes(p_batch uuid, p_quantity integer)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_m uuid := public.require_permission('generate_codes');
begin
  return public.generate_codes_core(p_batch, p_quantity);
end;
$$;

alter function public.discard_code_run(uuid) rename to discard_code_run_core;
revoke execute on function public.discard_code_run_core(uuid) from public, anon, authenticated;

create function public.discard_code_run(p_run uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_m uuid := public.require_permission('generate_codes');
begin
  perform public.discard_code_run_core(p_run);
end;
$$;

alter function public.attach_code_run_files(uuid, text, text) rename to attach_code_run_files_core;
revoke execute on function public.attach_code_run_files_core(uuid, text, text) from public, anon, authenticated;

create function public.attach_code_run_files(p_run uuid, p_csv text, p_pdf text)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_m uuid := public.require_permission('generate_codes');
  v_expires timestamptz;
  v_qty integer;
  v_no text;
begin
  v_expires := public.attach_code_run_files_core(p_run, p_csv, p_pdf);
  select r.quantity, b.batch_number into v_qty, v_no
    from public.code_runs r join public.batches b on b.id = r.batch_id where r.id = p_run;
  perform public.add_manufacturer_activity(v_m, auth.uid(), 'codes_generated',
    format('Generated %s codes for batch %s', to_char(v_qty, 'FM999,999,999,999'), v_no), v_no);
  return v_expires;
end;
$$;

alter function public.claim_expired_code_files() rename to claim_expired_code_files_core;
revoke execute on function public.claim_expired_code_files_core() from public, anon, authenticated;

create function public.claim_expired_code_files()
returns table (path text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_m uuid := public.require_permission('generate_codes', 'export_codes');
begin
  return query select c.path from public.claim_expired_code_files_core() c;
end;
$$;

-- The history of runs shows file paths only to people who may download the files.
alter function public.my_code_runs(uuid) rename to my_code_runs_core;
revoke execute on function public.my_code_runs_core(uuid) from public, anon, authenticated;

create function public.my_code_runs(p_batch uuid default null)
returns table (
  id uuid, run_no bigint, batch_id uuid, batch_number text, product_name text, variant text,
  quantity integer, generated_by_name text, created_at timestamptz,
  csv_path text, pdf_path text, files_expire_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_m uuid := public.current_manufacturer_id();
  v_export boolean := public.role_can((select role from public.manufacturer_members where user_id = auth.uid()), 'export_codes');
begin
  return query
    select c.id, c.run_no, c.batch_id, c.batch_number, c.product_name, c.variant, c.quantity, c.generated_by_name,
           c.created_at,
           case when v_export then c.csv_path end, case when v_export then c.pdf_path end, c.files_expire_at
      from public.my_code_runs_core(p_batch) c;
end;
$$;

revoke execute on function
  public.save_product(jsonb, uuid), public.declare_batch(jsonb), public.release_batch(uuid),
  public.generate_codes(uuid, integer), public.discard_code_run(uuid),
  public.attach_code_run_files(uuid, text, text), public.claim_expired_code_files(), public.my_code_runs(uuid)
  from public, anon;
grant execute on function
  public.save_product(jsonb, uuid), public.declare_batch(jsonb), public.release_batch(uuid),
  public.generate_codes(uuid, integer), public.discard_code_run(uuid),
  public.attach_code_run_files(uuid, text, text), public.claim_expired_code_files(), public.my_code_runs(uuid)
  to authenticated;

-- 12. Storage: the same permissions apply to the files.
drop policy product_images_insert on storage.objects;
drop policy product_images_delete on storage.objects;
create policy product_images_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and public.member_can((storage.foldername(name))[1], 'manage_products'));
create policy product_images_delete on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and public.member_can((storage.foldername(name))[1], 'manage_products'));

drop policy batch_certificates_insert on storage.objects;
drop policy batch_certificates_delete on storage.objects;
create policy batch_certificates_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'batch-certificates' and public.member_can((storage.foldername(name))[1], 'declare_batches'));
create policy batch_certificates_delete on storage.objects for delete to authenticated
  using (bucket_id = 'batch-certificates' and public.member_can((storage.foldername(name))[1], 'declare_batches'));

drop policy code_files_insert on storage.objects;
drop policy code_files_select on storage.objects;
drop policy code_files_delete on storage.objects;
create policy code_files_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'code-files' and public.member_can((storage.foldername(name))[1], 'generate_codes'));
create policy code_files_select on storage.objects for select to authenticated
  using (bucket_id = 'code-files' and public.member_can((storage.foldername(name))[1], 'export_codes'));
create policy code_files_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'code-files'
    and (public.member_can((storage.foldername(name))[1], 'generate_codes')
         or public.member_can((storage.foldername(name))[1], 'export_codes'))
  );
