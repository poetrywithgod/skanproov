-- SKANPROOV: manufacturer portal, step 7 (Overview).
--
-- The Overview shows counts the app already reads (products, batches, code runs) and the latest
-- entries of the activity log. This adds the one read it needs: the recent activity, limited to
-- roles that may view audit logs (Administrator, Code Manager, Compliance Officer).

create function public.my_recent_activity(p_limit integer default 5)
returns table (id uuid, kind text, summary text, actor_name text, created_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_m uuid := public.require_permission('view_audit_logs');
begin
  return query
    select a.id, a.kind, a.summary, pr.full_name, a.created_at
      from public.manufacturer_activity a
      left join public.profiles pr on pr.id = a.actor_id
     where a.manufacturer_id = v_m
     order by a.created_at desc
     limit least(greatest(coalesce(p_limit, 5), 1), 50);
end;
$$;

revoke execute on function public.my_recent_activity(integer) from public, anon;
grant execute on function public.my_recent_activity(integer) to authenticated;
