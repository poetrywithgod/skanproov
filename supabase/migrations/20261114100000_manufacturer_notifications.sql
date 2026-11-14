-- SKANPROOV: manufacturer portal, step 5 (notifications).
--
-- The portal's Notification screen lists what happened on the manufacturer's account: batches
-- declared and released, code runs ready, download files deleted after 30 days, and the company
-- being verified. They are written by the same functions that do the work, so a notification and its
-- action always happen together.
--
-- Notifications belong to the manufacturer, and so does the read/unread state (everyone in the
-- company sees the same; it can become per person when Team Management is built). The table is
-- closed to the API like the others; people read and mark them through functions.
-- Categories: batches, code_generation, account. (Security events have no source in the database
-- yet, so there is no security category.)

create table public.manufacturer_notifications (
  id uuid primary key default gen_random_uuid(),
  manufacturer_id uuid not null references public.manufacturers (id) on delete cascade,
  category text not null check (category in ('batches', 'code_generation', 'account')),
  kind text not null check (char_length(kind) between 1 and 40),
  title text not null check (char_length(title) between 1 and 160),
  body text not null check (char_length(body) between 1 and 500),
  ref_label text check (ref_label is null or char_length(ref_label) between 1 and 80),
  link text check (link is null or (link like '/manufacturer/%' and char_length(link) <= 200)),
  link_label text check (link_label is null or char_length(link_label) between 1 and 40),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index manufacturer_notifications_idx on public.manufacturer_notifications (manufacturer_id, created_at desc);

revoke all on public.manufacturer_notifications from anon, authenticated;
alter table public.manufacturer_notifications enable row level security;
create policy mfa_required on public.manufacturer_notifications as restrictive for all to authenticated using (public.mfa_satisfied());

-- Writing a notification. Not callable from the API; the functions below use it.
create function public.add_manufacturer_notification(
  p_manufacturer uuid, p_category text, p_kind text, p_title text, p_body text,
  p_ref text default null, p_link text default null, p_link_label text default null
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.manufacturer_notifications (manufacturer_id, category, kind, title, body, ref_label, link, link_label)
  values (p_manufacturer, p_category, p_kind, p_title, p_body, p_ref, p_link, p_link_label);
$$;

revoke execute on function public.add_manufacturer_notification(uuid, text, text, text, text, text, text, text)
  from public, anon, authenticated;

-- Reading and marking.
create function public.my_notifications()
returns table (
  id uuid, category text, kind text, title text, body text, ref_label text,
  link text, link_label text, created_at timestamptz, read_at timestamptz
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
    select n.id, n.category, n.kind, n.title, n.body, n.ref_label, n.link, n.link_label, n.created_at, n.read_at
      from public.manufacturer_notifications n
     where n.manufacturer_id = v_m
     order by n.created_at desc
     limit 200;
end;
$$;

create function public.set_notification_read(p_id uuid, p_read boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_m uuid := public.current_manufacturer_id();
begin
  update public.manufacturer_notifications
     set read_at = case when p_read then coalesce(read_at, now()) else null end
   where id = p_id and manufacturer_id = v_m;
end;
$$;

create function public.mark_all_notifications_read()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_m uuid := public.current_manufacturer_id();
begin
  update public.manufacturer_notifications set read_at = now() where manufacturer_id = v_m and read_at is null;
end;
$$;

revoke execute on function public.my_notifications(), public.set_notification_read(uuid, boolean), public.mark_all_notifications_read()
  from public, anon;
grant execute on function public.my_notifications(), public.set_notification_read(uuid, boolean), public.mark_all_notifications_read()
  to authenticated;

-- 1. Declaring a batch (replaces the earlier version; the only change is the notification).
create or replace function public.declare_batch(p jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_m uuid := public.current_manufacturer_id();
  v_product uuid := nullif(p ->> 'productId', '')::uuid;
  v_status text;
  v_name text;
  v_made date := (p ->> 'manufacturedOn')::date;
  v_expires date := nullif(p ->> 'expiresOn', '')::date;
  v_units integer := (p ->> 'units')::integer;
  v_number text := btrim(p ->> 'batchNumber');
  v_cert text := nullif(btrim(coalesce(p ->> 'certificatePath', '')), '');
  v_today date := (now() at time zone 'Africa/Lagos')::date;
  v_id uuid;
begin
  select status, name into v_status, v_name from public.products where id = v_product and manufacturer_id = v_m;
  if not found then raise exception 'no such product'; end if;
  if v_status = 'draft' then raise exception 'product is a draft'; end if;

  if v_made is null or v_made > v_today then raise exception 'bad manufacture date'; end if;
  if v_expires is not null and v_expires <= v_made then raise exception 'bad expiry date'; end if;

  -- Certificates live in the manufacturer's own folder.
  if v_cert is not null and split_part(v_cert, '/', 1) <> v_m::text then raise exception 'wrong folder'; end if;

  begin
    insert into public.batches (
      product_id, batch_number, manufactured_on, expires_on, units, facility, notes,
      certificate_path, declared_by
    ) values (
      v_product, v_number, v_made, v_expires, v_units,
      nullif(btrim(coalesce(p ->> 'facility', '')), ''),
      nullif(btrim(coalesce(p ->> 'notes', '')), ''),
      v_cert, auth.uid()
    ) returning id into v_id;
  exception when unique_violation then
    raise exception 'batch number taken';
  end;

  perform public.add_manufacturer_notification(
    v_m, 'batches', 'batch_declared', 'Batch declared',
    format('Batch %s of %s was registered with %s units. Generate its codes next.', v_number, v_name, to_char(v_units, 'FM999,999,999')),
    'Batch ' || v_number, '/manufacturer/batches/' || v_id, 'View batch'
  );
  return v_id;
end;
$$;

-- 2. Releasing a batch (replaces the earlier version; the only change is the notification).
create or replace function public.release_batch(p_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_m uuid := public.current_manufacturer_id();
  b public.batches%rowtype;
begin
  select bt.* into b
    from public.batches bt
    join public.products p on p.id = bt.product_id
   where bt.id = p_id and p.manufacturer_id = v_m
     for update of bt;
  if not found then raise exception 'no such batch'; end if;
  if b.status <> 'active' then raise exception 'batch is %', b.status; end if;
  if b.released_at is not null then return b.released_at; end if;
  if not exists (select 1 from public.codes where batch_id = b.id) then raise exception 'no codes'; end if;

  update public.batches set released_at = now() where id = b.id returning released_at into b.released_at;

  perform public.add_manufacturer_notification(
    v_m, 'batches', 'batch_released', 'Batch released',
    format('Batch %s was released. Its codes now verify for shoppers and retailers.', b.batch_number),
    'Batch ' || b.batch_number, '/manufacturer/batches/' || b.id, 'View batch'
  );
  return b.released_at;
end;
$$;

-- 3. Code files stored (replaces the earlier version; the only change is the notification).
create or replace function public.attach_code_run_files(p_run uuid, p_csv text, p_pdf text)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_m uuid := public.current_manufacturer_id();
  v_expires timestamptz := now() + interval '30 days';
  v_run public.code_runs%rowtype;
  v_batch text;
begin
  if split_part(p_csv, '/', 1) <> v_m::text or split_part(p_pdf, '/', 1) <> v_m::text then
    raise exception 'wrong folder';
  end if;
  update public.code_runs r
     set csv_path = p_csv, pdf_path = p_pdf, files_expire_at = v_expires
    from public.batches b
    join public.products p on p.id = b.product_id
   where r.id = p_run and b.id = r.batch_id and p.manufacturer_id = v_m
  returning r.* into v_run;
  if not found then raise exception 'no such run'; end if;

  select batch_number into v_batch from public.batches where id = v_run.batch_id;
  perform public.add_manufacturer_notification(
    v_m, 'code_generation', 'codes_ready',
    'Codes ready to download',
    format('GEN-%s: %s codes were generated for batch %s. Download the files within 30 days.',
           lpad(v_run.run_no::text, 5, '0'), to_char(v_run.quantity, 'FM999,999,999'), v_batch),
    'Batch ' || v_batch, '/manufacturer/code-management', 'Open Code Management'
  );
  return v_expires;
end;
$$;

-- 4. Files older than 30 days (replaces the earlier version; the only change is the notification).
create or replace function public.claim_expired_code_files()
returns table (path text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_m uuid := public.current_manufacturer_id();
  v_run record;
begin
  for v_run in
    select r.id, r.run_no, r.csv_path as c, r.pdf_path as f, b.batch_number
      from public.code_runs r
      join public.batches b on b.id = r.batch_id
      join public.products p on p.id = b.product_id
     where p.manufacturer_id = v_m and r.files_expire_at <= now() and r.files_removed_at is null
       for update of r
  loop
    update public.code_runs set csv_path = null, pdf_path = null, files_removed_at = now() where id = v_run.id;
    perform public.add_manufacturer_notification(
      v_m, 'code_generation', 'files_deleted', 'Download files deleted',
      format('The files for GEN-%s (batch %s) were deleted after 30 days. The codes themselves still work.',
             lpad(v_run.run_no::text, 5, '0'), v_run.batch_number),
      'Batch ' || v_run.batch_number, '/manufacturer/code-management', 'Open Code Management'
    );
    path := v_run.c; return next;
    path := v_run.f; return next;
  end loop;
end;
$$;

-- 5. Approving a company (replaces the earlier version; the only change is the notification).
create or replace function public.approve_manufacturer_application(p_application uuid)
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

  perform public.add_manufacturer_notification(
    v_manufacturer, 'account', 'company_verified', 'Your company is verified',
    format('%s has been verified. You can now register products, declare batches and generate codes.', a.company_name),
    null, '/manufacturer/products', 'View products'
  );
  return v_manufacturer;
end;
$$;

revoke execute on function public.approve_manufacturer_application(uuid) from public, anon, authenticated;
