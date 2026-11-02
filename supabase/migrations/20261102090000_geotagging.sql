-- SKANPROOV: optional location on scans (Phase 1).
--
-- Off by default. A signed-in person can turn it on in their profile. When on, the result screen
-- asks the browser for the device's location once and attaches it to that scan. Coordinates are
-- rounded to about 100 metres before they are stored. The purpose is to spot a single code being
-- scanned in places far apart (a sign it was copied). Nothing here is shown to other users.

alter table public.profiles add column geotag_scans boolean not null default false;
grant update (geotag_scans) on public.profiles to authenticated;

alter table public.scans
  add column lat numeric(8, 5) check (lat between -90 and 90),
  add column lng numeric(8, 5) check (lng between -180 and 180);

-- Attaches a location to the signed-in person's latest scan of this code that has none yet.
-- Returns true when a location was stored.
create function public.attach_scan_location(p_code text, p_lat double precision, p_lng double precision)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_input text := upper(left(btrim(coalesce(p_code, '')), 64));
  v_scan uuid;
begin
  if v_uid is null or v_input = '' then
    return false;
  end if;
  if p_lat is null or p_lng is null or p_lat not between -90 and 90 or p_lng not between -180 and 180 then
    raise exception 'invalid location';
  end if;
  -- Only when the person has opted in.
  if not exists (select 1 from public.profiles where id = v_uid and geotag_scans) then
    return false;
  end if;

  select id into v_scan
    from public.scans
   where user_id = v_uid and code_input = v_input and lat is null
   order by scanned_at desc
   limit 1;
  if v_scan is null then
    return false;
  end if;

  update public.scans set lat = round(p_lat::numeric, 3), lng = round(p_lng::numeric, 3) where id = v_scan;
  return true;
end;
$$;

revoke execute on function public.attach_scan_location(text, double precision, double precision) from public, anon;
grant execute on function public.attach_scan_location(text, double precision, double precision) to authenticated;
