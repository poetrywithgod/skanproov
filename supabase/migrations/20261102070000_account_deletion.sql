-- SKANPROOV: let people delete their own account (Phase 1).
--
-- Deleting the login removes everything that belongs to the person: profile, scans, points and
-- notifications (all cascade from auth.users). Reports they sent stay, without their name.
--
-- One rule changes with it: a code that someone has already claimed stays claimed even after that
-- person deletes their account. Before, the claim was tracked by who owned it, so deleting an
-- account would have made the code claimable again and let a second person earn its points.
-- Now it is tracked by first_scanned_at, which survives deletion.

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
         b.status as batch_status, b.released_at, b.expires_on, b.batch_number, b.manufactured_on,
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

  return jsonb_build_object('status', v_status, 'product', v_product, 'points', v_points);
end;
$$;


revoke execute on function public.verify_product(text) from public;
grant execute on function public.verify_product(text) to anon, authenticated;

-- Permanently deletes the signed-in person's account.
create function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not signed in';
  end if;
  delete from auth.users where id = v_uid;
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
