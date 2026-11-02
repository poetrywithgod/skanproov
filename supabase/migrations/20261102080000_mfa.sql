-- SKANPROOV: two-factor authentication (authenticator app) for consumer accounts (Phase 1).
--
-- Supabase handles enrolling and checking the six-digit codes. This migration makes sure the
-- second step cannot be skipped: for a person who has turned on two-factor, a session that only
-- passed the password step (aal1) can no longer read or change their own data. Only a session
-- that also passed the code step (aal2) can. People without two-factor are unaffected.

create function public.mfa_satisfied()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
      or not exists (
        select 1 from auth.mfa_factors where user_id = auth.uid() and status = 'verified'
      );
$$;

revoke execute on function public.mfa_satisfied() from public, anon;
grant execute on function public.mfa_satisfied() to authenticated;

-- Restrictive policies are ANDed with the existing ones, so they only ever narrow access.
create policy mfa_required on public.profiles as restrictive for all to authenticated using (public.mfa_satisfied());
create policy mfa_required on public.scans as restrictive for all to authenticated using (public.mfa_satisfied());
create policy mfa_required on public.points_ledger as restrictive for all to authenticated using (public.mfa_satisfied());
create policy mfa_required on public.notifications as restrictive for all to authenticated using (public.mfa_satisfied());
create policy mfa_required on public.product_reports as restrictive for all to authenticated using (public.mfa_satisfied());
