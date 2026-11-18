-- SKANPROOV: manufacturer Overview, scan activity and download links.
--
--   * my_scan_activity(days): scans of this company's codes per day (Nigerian time), split into
--     authentic (first genuine result), repeat (a code already scanned by someone else) and other
--     (recalled or expired). Counts the consumer scans the verification function records: one per
--     person, code and result, and only for signed-in people. Retailer carton scans are separate
--     and are not included. For any active member.
--   * manufacturer_activity.run_id: a code-generation entry now knows its run, so the Overview can
--     link its CSV and label PDF while they are still kept (30 days).
--   * my_recent_activity now also returns that run id, only while its files exist.

-- 1. Scan activity.
create function public.my_scan_activity(p_days integer default 7)
returns table (day date, authentic bigint, repeat_scans bigint, other bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_m uuid := public.current_manufacturer_id();
  v_n integer := least(greatest(coalesce(p_days, 7), 1), 90);
  v_today date := (now() at time zone 'Africa/Lagos')::date;
begin
  return query
    with days as (
      select (v_today - g)::date as d from generate_series(0, v_n - 1) g
    ),
    counts as (
      select (s.scanned_at at time zone 'Africa/Lagos')::date as d,
             count(*) filter (where s.result = 'genuine') as a,
             count(*) filter (where s.result = 'duplicate') as r,
             count(*) filter (where s.result in ('recalled', 'expired')) as o
        from public.scans s
        join public.codes c on c.id = s.code_id
        join public.batches b on b.id = c.batch_id
        join public.products p on p.id = b.product_id
       where p.manufacturer_id = v_m
         and (s.scanned_at at time zone 'Africa/Lagos')::date > v_today - v_n
       group by 1
    )
    select days.d, coalesce(counts.a, 0), coalesce(counts.r, 0), coalesce(counts.o, 0)
      from days left join counts on counts.d = days.d
     order by days.d;
end;
$$;

revoke execute on function public.my_scan_activity(integer) from public, anon;
grant execute on function public.my_scan_activity(integer) to authenticated;

-- 2. Code-generation entries remember their run.
alter table public.manufacturer_activity add column run_id uuid references public.code_runs (id) on delete set null;

update public.manufacturer_activity a
   set run_id = (
     select r.id
       from public.code_runs r
       join public.batches b on b.id = r.batch_id
       join public.products p on p.id = b.product_id
      where p.manufacturer_id = a.manufacturer_id and b.batch_number = a.ref_label and r.created_at <= a.created_at
      order by r.created_at desc
      limit 1
   )
 where a.kind = 'codes_generated' and a.run_id is null;

create or replace function public.attach_code_run_files(p_run uuid, p_csv text, p_pdf text)
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
  insert into public.manufacturer_activity (manufacturer_id, actor_id, kind, summary, ref_label, run_id)
  values (v_m, auth.uid(), 'codes_generated',
          format('Generated %s codes for batch %s', to_char(v_qty, 'FM999,999,999,999'), v_no), v_no, p_run);
  return v_expires;
end;
$$;

-- 3. Recent activity with the run id (only while the run's files are still kept).
drop function public.my_recent_activity(integer);

create function public.my_recent_activity(p_limit integer default 5)
returns table (id uuid, kind text, summary text, actor_name text, created_at timestamptz, run_id uuid)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_m uuid := public.require_permission('view_audit_logs');
begin
  return query
    select a.id, a.kind, a.summary, pr.full_name, a.created_at,
           case when r.csv_path is not null and r.files_removed_at is null
                 and (r.files_expire_at is null or r.files_expire_at > now()) then r.id end
      from public.manufacturer_activity a
      left join public.profiles pr on pr.id = a.actor_id
      left join public.code_runs r on r.id = a.run_id
     where a.manufacturer_id = v_m
     order by a.created_at desc
     limit least(greatest(coalesce(p_limit, 5), 1), 50);
end;
$$;

revoke execute on function public.my_recent_activity(integer) from public, anon;
grant execute on function public.my_recent_activity(integer) to authenticated;
