-- SKANPROOV: recalling and revoking batches (manufacturer portal).
--
-- Decisions (18 Nov 2026): whole batches only. A RECALL is for a problem with the product (quality,
-- safety, labelling, a regulator's order); it applies to a released batch and can be lifted by an
-- Administrator or Compliance Officer if it was a mistake. A REVOKE is final: the codes were
-- compromised, issued in error or the run was cancelled. A reason is required, and the customer
-- message the manufacturer writes is shown on the recalled result (shoppers and retailers).
--
-- Both need the recall_codes permission (Administrator, Compliance Officer). The verification
-- functions already treat 'recalled' and 'revoked' as recalled; they now also return the message.

alter table public.batches
  add column status_reason text,
  add column status_message text check (status_message is null or char_length(status_message) between 10 and 200),
  add column status_note text check (status_note is null or char_length(status_note) <= 500),
  add column status_changed_at timestamptz,
  add column status_changed_by uuid references auth.users (id) on delete set null;

-- Labels for the audit log text.
create function public.batch_reason_label(p_reason text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case p_reason
    when 'quality_issue' then 'quality issue'
    when 'safety_concern' then 'safety concern'
    when 'labelling_error' then 'labelling error'
    when 'regulatory_action' then 'regulatory action'
    when 'codes_compromised' then 'codes compromised'
    when 'issued_in_error' then 'issued in error'
    when 'production_cancelled' then 'production cancelled'
    else 'other reason'
  end;
$$;
revoke execute on function public.batch_reason_label(text) from public, anon, authenticated;

-- 1. Recall a released batch.
create function public.recall_batch(p_id uuid, p_reason text, p_message text, p_note text default null)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_m uuid := public.require_permission('recall_codes');
  b record;
  v_msg text := btrim(coalesce(p_message, ''));
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
begin
  if p_reason not in ('quality_issue', 'safety_concern', 'labelling_error', 'regulatory_action', 'other') then
    raise exception 'invalid reason';
  end if;
  if char_length(v_msg) not between 10 and 200 then raise exception 'invalid message'; end if;
  if v_note is not null and char_length(v_note) > 500 then raise exception 'invalid note'; end if;

  select ba.id, ba.batch_number, ba.status, ba.released_at into b
    from public.batches ba join public.products p on p.id = ba.product_id
   where ba.id = p_id and p.manufacturer_id = v_m for update of ba;
  if not found then raise exception 'no such batch'; end if;
  if b.status = 'recalled' then raise exception 'already recalled'; end if;
  if b.status = 'revoked' then raise exception 'batch is revoked'; end if;
  if b.released_at is null then raise exception 'batch not released'; end if;

  update public.batches
     set status = 'recalled', status_reason = p_reason, status_message = v_msg, status_note = v_note,
         status_changed_at = now(), status_changed_by = auth.uid()
   where id = p_id;
  perform public.add_manufacturer_activity(v_m, auth.uid(), 'batch_recalled',
    format('Recalled batch %s (%s)', b.batch_number, public.batch_reason_label(p_reason)), b.batch_number);
  perform public.add_manufacturer_notification(v_m, 'batches', 'batch_recalled', 'Batch recalled',
    format('Batch %s was recalled: %s.', b.batch_number, public.batch_reason_label(p_reason)), b.batch_number,
    '/manufacturer/batches/' || p_id::text, 'Open batch');
end;
$$;

-- 2. Lift a recall (revoked batches cannot be reinstated).
create function public.lift_recall(p_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_m uuid := public.require_permission('recall_codes');
  b record;
begin
  select ba.id, ba.batch_number, ba.status into b
    from public.batches ba join public.products p on p.id = ba.product_id
   where ba.id = p_id and p.manufacturer_id = v_m for update of ba;
  if not found then raise exception 'no such batch'; end if;
  if b.status = 'revoked' then raise exception 'batch is revoked'; end if;
  if b.status <> 'recalled' then raise exception 'not recalled'; end if;

  update public.batches
     set status = 'active', status_reason = null, status_message = null, status_note = null,
         status_changed_at = now(), status_changed_by = auth.uid()
   where id = p_id;
  perform public.add_manufacturer_activity(v_m, auth.uid(), 'recall_lifted',
    format('Lifted the recall on batch %s', b.batch_number), b.batch_number);
  perform public.add_manufacturer_notification(v_m, 'batches', 'recall_lifted', 'Recall lifted',
    format('The recall on batch %s was lifted. Its codes verify again.', b.batch_number), b.batch_number,
    '/manufacturer/batches/' || p_id::text, 'Open batch');
end;
$$;

-- 3. Revoke a batch for good.
create function public.revoke_batch(p_id uuid, p_reason text, p_message text, p_note text default null)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_m uuid := public.require_permission('recall_codes');
  b record;
  v_msg text := btrim(coalesce(p_message, ''));
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
begin
  if p_reason not in ('codes_compromised', 'issued_in_error', 'production_cancelled', 'other') then
    raise exception 'invalid reason';
  end if;
  if char_length(v_msg) not between 10 and 200 then raise exception 'invalid message'; end if;
  if v_note is not null and char_length(v_note) > 500 then raise exception 'invalid note'; end if;

  select ba.id, ba.batch_number, ba.status into b
    from public.batches ba join public.products p on p.id = ba.product_id
   where ba.id = p_id and p.manufacturer_id = v_m for update of ba;
  if not found then raise exception 'no such batch'; end if;
  if b.status = 'revoked' then raise exception 'batch is revoked'; end if;

  update public.batches
     set status = 'revoked', status_reason = p_reason, status_message = v_msg, status_note = v_note,
         status_changed_at = now(), status_changed_by = auth.uid()
   where id = p_id;
  perform public.add_manufacturer_activity(v_m, auth.uid(), 'batch_revoked',
    format('Revoked batch %s (%s)', b.batch_number, public.batch_reason_label(p_reason)), b.batch_number);
  perform public.add_manufacturer_notification(v_m, 'batches', 'batch_revoked', 'Batch revoked',
    format('Batch %s was revoked: %s. This cannot be undone.', b.batch_number, public.batch_reason_label(p_reason)), b.batch_number,
    '/manufacturer/batches/' || p_id::text, 'Open batch');
end;
$$;

-- 4. What the batch page shows about a recall or revoke. Any active member.
create function public.batch_status_detail(p_id uuid)
returns table (reason text, message text, note text, changed_at timestamptz, changed_by_name text)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_m uuid := public.current_manufacturer_id();
begin
  return query
    select ba.status_reason, ba.status_message, ba.status_note, ba.status_changed_at, pr.full_name
      from public.batches ba
      join public.products p on p.id = ba.product_id
      left join public.profiles pr on pr.id = ba.status_changed_by
     where ba.id = p_id and p.manufacturer_id = v_m and ba.status <> 'active';
end;
$$;

revoke execute on function
  public.recall_batch(uuid, text, text, text), public.lift_recall(uuid),
  public.revoke_batch(uuid, text, text, text), public.batch_status_detail(uuid)
  from public, anon;
grant execute on function
  public.recall_batch(uuid, text, text, text), public.lift_recall(uuid),
  public.revoke_batch(uuid, text, text, text), public.batch_status_detail(uuid)
  to authenticated;

-- 5. The audit log filter learns the new events.
create or replace function public.audit_group(p_kind text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when p_kind in ('batch_declared', 'batch_released', 'batch_recalled', 'recall_lifted', 'batch_revoked') then 'batches'
    when p_kind in ('codes_generated', 'codes_exported') then 'codes'
    when p_kind = 'product_registered' then 'products'
    when p_kind in ('member_invited', 'invite_cancelled', 'role_changed', 'member_revoked', 'member_joined') then 'team'
    when p_kind = 'settings_updated' then 'settings'
    when p_kind = 'audit_exported' then 'audit'
    else 'other'
  end;
$$;

-- 6. Shoppers and retailers see the manufacturer's message on a recalled result.
create or replace function public.verify_product(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_input text := upper(left(btrim(coalesce(p_code, '')), 64));
  v_pin text := regexp_replace(upper(left(btrim(coalesce(p_code, '')), 64)), '[\s-]', '', 'g');
  v_uid uuid := auth.uid();
  r record;
  v_status text;
  v_points integer := 0;
  v_scan_id uuid;
  v_note text;
  v_title text;
  v_body text;
  v_kind text;
  v_today date := (now() at time zone 'Africa/Lagos')::date;
  v_product jsonb;
begin
  if v_input = '' then
    return jsonb_build_object('status', 'not_verified');
  end if;

  select c.id as code_id, c.first_scanned_by, c.first_scanned_at, c.flagged_duplicate,
         b.status as batch_status, b.status_message, b.released_at, b.expires_on, b.batch_number, b.manufactured_on,
         p.name, p.variant, p.nafdac_number, p.points_per_scan, m.name as manufacturer
    into r
    from public.codes c
    join public.batches b on b.id = c.batch_id
    join public.products p on p.id = b.product_id
    join public.manufacturers m on m.id = p.manufacturer_id
   where c.qr_hash = public.code_hash(v_input)
      or (v_pin ~ '^[0-9]{12}$' and c.pin_hash = public.code_hash(v_pin))
   for update of c;

  -- Unknown, or the batch has not been released yet: we cannot confirm it. Never a verdict of "fake".
  if not found or r.released_at is null then
    if v_uid is not null then
      insert into public.scans (user_id, code_input, result)
      values (v_uid, v_input, 'not_verified')
      on conflict (user_id, code_input) where code_id is null do nothing;
    end if;
    return jsonb_build_object('status', 'not_verified');
  end if;

  v_product := jsonb_build_object(
    'name', r.name,
    'variant', r.variant,
    'manufacturer', r.manufacturer,
    'batch_number', r.batch_number,
    'nafdac_number', r.nafdac_number,
    'manufactured_on', r.manufactured_on,
    'expires_on', r.expires_on
  );

  if r.batch_status in ('recalled', 'revoked') then
    v_status := 'recalled';
    v_note := 'This batch has been recalled by the manufacturer.';
  elsif r.expires_on is not null and r.expires_on < v_today then
    v_status := 'expired';
    v_note := 'This product has passed its expiry date.';
  elsif v_uid is null then
    -- Without an account we only read the current state; we never change it.
    v_status := case when r.flagged_duplicate then 'duplicate' else 'genuine' end;
  elsif r.first_scanned_at is null or r.first_scanned_by = v_uid then
    v_status := 'genuine';
  else
    v_status := 'duplicate';
  end if;

  if v_status = 'duplicate' then
    v_note := 'This code was already scanned by someone else.';
  end if;

  if v_uid is not null then
    if v_status = 'genuine' and r.first_scanned_at is null then
      v_points := r.points_per_scan;
    end if;

    insert into public.scans (user_id, code_id, code_input, result, product_name, variant, manufacturer_name,
                              batch_number, nafdac_number, note, points)
    values (v_uid, r.code_id, v_input, v_status, r.name, r.variant, r.manufacturer,
            r.batch_number, r.nafdac_number, v_note, v_points)
    on conflict (user_id, code_id, result) where code_id is not null do nothing
    returning id into v_scan_id;

    if v_scan_id is null then
      -- Seen before by this person: show the result again, but nothing new is recorded or earned.
      v_points := 0;
    else
      update public.codes
         set scan_count = scan_count + 1,
             flagged_duplicate = flagged_duplicate or v_status = 'duplicate',
             first_scanned_by = case when v_status = 'genuine' and first_scanned_at is null then v_uid else first_scanned_by end,
             first_scanned_at = case when v_status = 'genuine' and first_scanned_at is null then now() else first_scanned_at end
       where id = r.code_id;

      if v_points > 0 then
        insert into public.points_ledger (user_id, scan_id, points, kind) values (v_uid, v_scan_id, v_points, 'earned');
      end if;

      v_kind := case v_status
        when 'genuine' then 'verified'
        when 'duplicate' then 'unverified'
        else v_status
      end;
      v_title := case v_status
        when 'genuine' then 'Your product has been verified!'
        when 'duplicate' then 'Your product is Unverified!'
        when 'recalled' then 'This Product Has Been Recalled'
        else 'Expired Product'
      end;
      v_body := case v_status
        when 'genuine' then 'Good news! Your scanned product is registered with SKANPROOV and has passed its verification checks.'
        when 'duplicate' then 'This product has unusual verification activity. Please review the scan result before proceeding.'
        when 'recalled' then 'This product has been recalled by the manufacturer. Do not purchase or use it. Follow the recommended next steps.'
        else 'This product has passed its expiry date. Do not purchase or use it.'
      end;
      insert into public.notifications (user_id, scan_id, kind, title, body)
      values (v_uid, v_scan_id, v_kind, v_title, v_body);
    end if;
  end if;

  return jsonb_build_object('status', v_status, 'product', v_product, 'points', v_points,
                            'message', case when v_status = 'recalled' then r.status_message end);
end;
$$;

create or replace function public.retailer_verify_carton(p_code text, p_branch uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_retailer uuid;
  v_input text := upper(left(btrim(coalesce(p_code, '')), 64));
  v_today date := (now() at time zone 'Africa/Lagos')::date;
  r record;
  v_status text;
  v_reason text;
  v_scan uuid;
  v_received boolean := false;
  v_carton jsonb;
begin
  if v_uid is null then raise exception 'not signed in'; end if;
  select id into v_retailer from public.retailers where owner_id = v_uid;
  if v_retailer is null then raise exception 'not a retailer'; end if;
  if not exists (
    select 1 from public.retailer_branches where id = p_branch and retailer_id = v_retailer and status = 'approved'
  ) then
    raise exception 'branch not approved';
  end if;
  if v_input = '' then raise exception 'empty code'; end if;

  select c.id as carton_id, c.carton_number, c.received_by_retailer,
         b.batch_number, b.status as batch_status, b.status_message, b.released_at, b.expires_on, b.manufactured_on,
         p.name as product_name, p.variant, m.id as manufacturer_id, m.name as manufacturer_name
    into r
    from public.cartons c
    join public.batches b on b.id = c.batch_id
    join public.products p on p.id = b.product_id
    join public.manufacturers m on m.id = p.manufacturer_id
   where c.qr_hash = public.code_hash(v_input) or c.carton_number = v_input
   limit 1;

  if not found or r.released_at is null then
    v_status := 'suspicious';
    v_reason := 'We could not find this carton in SKANPROOV records.';
  elsif r.batch_status in ('recalled', 'revoked') then
    v_status := 'recalled';
    v_reason := r.manufacturer_name || ' recalled batch ' || r.batch_number || '.'
                || coalesce(' ' || r.status_message, '');
  elsif r.expires_on is not null and r.expires_on < v_today then
    v_status := 'expired';
    v_reason := 'This batch expired on ' || to_char(r.expires_on, 'FMDD Mon YYYY') || '.';
  elsif not exists (
    select 1 from public.retailer_connections where retailer_id = v_retailer and manufacturer_id = r.manufacturer_id
  ) then
    v_status := 'suspicious';
    v_reason := 'You are not connected to ' || r.manufacturer_name || ' yet, so we cannot confirm this carton.';
  elsif r.received_by_retailer is not null and r.received_by_retailer <> v_retailer then
    v_status := 'suspicious';
    v_reason := 'This carton was already received by another shop.';
  else
    v_status := 'safe';
    v_reason := 'This carton is registered and from a manufacturer you are connected to.';
    v_received := r.received_by_retailer = v_retailer;
  end if;

  insert into public.carton_scans (retailer_id, branch_id, carton_id, code_input, result, reason,
                                   product_name, manufacturer_name, batch_number, carton_number)
  values (v_retailer, p_branch, r.carton_id, v_input, v_status, v_reason,
          r.product_name, r.manufacturer_name, r.batch_number, r.carton_number)
  on conflict do nothing
  returning id into v_scan;

  if v_scan is null then
    select id into v_scan from public.carton_scans
     where branch_id = p_branch and result = v_status
       and ((r.carton_id is not null and carton_id = r.carton_id) or (r.carton_id is null and code_input = v_input))
     limit 1;
  end if;

  if r.carton_id is not null then
    v_carton := jsonb_build_object(
      'product', r.product_name, 'variant', r.variant, 'manufacturer', r.manufacturer_name,
      'manufacturer_id', r.manufacturer_id, 'batch_number', r.batch_number, 'carton_number', r.carton_number,
      'manufactured_on', r.manufactured_on, 'expires_on', r.expires_on
    );
  end if;

  return jsonb_build_object(
    'status', v_status, 'reason', v_reason, 'scan_id', v_scan, 'received', v_received, 'carton', v_carton
  );
end;
$$;
