-- SKANPROOV: retailer notifications.
--
-- Notifications are worked out from real records (scans that need attention, branch and
-- business-detail decisions), so nothing is stored per notification. The only thing saved is
-- when the shop last pressed "Mark all read"; anything newer than that is unread.

alter table public.retailers add column notifications_read_at timestamptz;

create function public.mark_retailer_notifications_read()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.retailers set notifications_read_at = now() where owner_id = auth.uid();
end;
$$;

revoke execute on function public.mark_retailer_notifications_read() from public, anon;
grant execute on function public.mark_retailer_notifications_read() to authenticated;
