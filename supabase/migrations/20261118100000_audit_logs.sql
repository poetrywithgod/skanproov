-- SKANPROOV: manufacturer portal, step 8 (Audit Logs).
--
-- The Audit Logs screen reads the activity log that Team Management started (manufacturer_activity).
-- This adds:
--   * audit_log(search, type, days, limit, offset): one page of the log plus the total, for roles that
--     may view audit logs (Administrator, Code Manager, Compliance Officer).
--   * audit_log_export(search, type, days): the same filter without paging (up to 10,000 rows), for roles
--     that may export audit logs (Administrator, Compliance Officer). Exporting is itself logged.
--   * record_code_download(run, kind): logs a CSV or label PDF download, so exports show in the log.
--
-- Only events the system really records appear. Blocked sign-ins, device checks, printing and
-- reconciliation and SKANPROOV review events do not exist yet (see docs/DEFERRED.md).

-- 1. Which filter group an event belongs to.
create function public.audit_group(p_kind text)
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
    when p_kind = 'audit_exported' then 'audit'
    else 'other'
  end;
$$;

revoke execute on function public.audit_group(text) from public, anon, authenticated;

-- 2. The shared filter. Internal.
create function public.audit_filtered(p_m uuid, p_search text, p_group text, p_days integer)
returns table (id uuid, kind text, summary text, ref_label text, actor_name text, actor_role text, created_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select a.id, a.kind, a.summary, a.ref_label, pr.full_name, public.role_label(mm.role), a.created_at
    from public.manufacturer_activity a
    left join public.profiles pr on pr.id = a.actor_id
    left join public.manufacturer_members mm on mm.user_id = a.actor_id and mm.manufacturer_id = a.manufacturer_id
   where a.manufacturer_id = p_m
     and (p_group is null or p_group = '' or public.audit_group(a.kind) = p_group)
     and (p_days is null or a.created_at >= now() - make_interval(days => least(greatest(p_days, 1), 3650)))
     and (
       p_search is null or btrim(p_search) = ''
       or a.summary ilike '%' || replace(replace(replace(btrim(p_search), '\', '\\'), '%', '\%'), '_', '\_') || '%'
       or a.ref_label ilike '%' || replace(replace(replace(btrim(p_search), '\', '\\'), '%', '\%'), '_', '\_') || '%'
       or pr.full_name ilike '%' || replace(replace(replace(btrim(p_search), '\', '\\'), '%', '\%'), '_', '\_') || '%'
     );
$$;

revoke execute on function public.audit_filtered(uuid, text, text, integer) from public, anon, authenticated;

-- 3. One page of the log, newest first, with the total number of matching records.
create function public.audit_log(
  p_search text default null, p_group text default null, p_days integer default null,
  p_limit integer default 10, p_offset integer default 0
)
returns table (
  id uuid, kind text, summary text, ref_label text, actor_name text, actor_role text,
  created_at timestamptz, total bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_m uuid := public.require_permission('view_audit_logs');
begin
  return query
    select f.id, f.kind, f.summary, f.ref_label, f.actor_name, f.actor_role, f.created_at,
           count(*) over () as total
      from public.audit_filtered(v_m, p_search, p_group, p_days) f
     order by f.created_at desc, f.id desc
     limit least(greatest(coalesce(p_limit, 10), 1), 100)
    offset greatest(coalesce(p_offset, 0), 0);
end;
$$;

revoke execute on function public.audit_log(text, text, integer, integer, integer) from public, anon;
grant execute on function public.audit_log(text, text, integer, integer, integer) to authenticated;

-- 4. The export. Needs the export permission, and writes an entry of its own.
create function public.audit_log_export(p_search text default null, p_group text default null, p_days integer default null)
returns table (
  id uuid, kind text, summary text, ref_label text, actor_name text, actor_role text, created_at timestamptz
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_m uuid := public.require_permission('export_audit_logs');
begin
  perform public.add_manufacturer_activity(v_m, auth.uid(), 'audit_exported', 'Exported the audit log');
  return query
    select f.id, f.kind, f.summary, f.ref_label, f.actor_name, f.actor_role, f.created_at
      from public.audit_filtered(v_m, p_search, p_group, p_days) f
     where f.created_at <= now()
     order by f.created_at desc, f.id desc
     limit 10000;
end;
$$;

revoke execute on function public.audit_log_export(text, text, integer) from public, anon;
grant execute on function public.audit_log_export(text, text, integer) to authenticated;

-- 5. A download of a code file is an export, so it is logged.
create function public.record_code_download(p_run uuid, p_kind text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_m uuid := public.require_permission('export_codes');
  v_no text;
begin
  if p_kind not in ('csv', 'pdf') then
    raise exception 'unknown file kind';
  end if;
  select b.batch_number into v_no
    from public.code_runs r
    join public.batches b on b.id = r.batch_id
    join public.products p on p.id = b.product_id
   where r.id = p_run and p.manufacturer_id = v_m;
  if v_no is null then
    return;
  end if;
  perform public.add_manufacturer_activity(v_m, auth.uid(), 'codes_exported',
    format('Downloaded the %s for batch %s', case p_kind when 'csv' then 'code CSV' else 'label PDF' end, v_no), v_no);
end;
$$;

revoke execute on function public.record_code_download(uuid, text) from public, anon;
grant execute on function public.record_code_download(uuid, text) to authenticated;
