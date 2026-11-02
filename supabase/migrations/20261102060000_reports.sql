-- SKANPROOV: "report an issue" submissions from shoppers (Phase 1).
--
-- Anyone can send a report, signed in or not (a confidential tip should not need an account).
-- Nobody can read other people's reports; only the sender can read their own.
-- Reports go in through public.submit_report() so the table itself stays closed to the API.

create table public.product_reports (
  id uuid primary key default gen_random_uuid(),
  -- Empty when sent without an account.
  user_id uuid references auth.users (id) on delete set null,
  -- Set when the code matches one we know, so the report can be tied to a batch.
  code_id uuid references public.codes (id) on delete set null,
  -- What the person scanned or typed (upper-cased). Optional: they may be reporting a shop, not a code.
  code_input text,
  kind text not null check (kind in ('suspected_fake', 'tampered_seal', 'wrong_details', 'expired_on_sale', 'other')),
  place text check (char_length(place) <= 200),
  details text check (char_length(details) <= 1000),
  status text not null default 'new' check (status in ('new', 'reviewing', 'closed')),
  created_at timestamptz not null default now(),
  -- A report must say something: a code, a place or some details.
  check (code_input is not null or place is not null or details is not null)
);

create index product_reports_user_idx on public.product_reports (user_id, created_at desc);
create index product_reports_code_idx on public.product_reports (code_id);

revoke all on public.product_reports from anon, authenticated;
alter table public.product_reports enable row level security;

grant select on public.product_reports to authenticated;
create policy reports_select_own on public.product_reports for select to authenticated using (user_id = auth.uid());

-- Sends a report. Returns true when it was saved.
create function public.submit_report(p_kind text, p_code text, p_place text, p_details text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_code text := nullif(upper(left(btrim(coalesce(p_code, '')), 64)), '');
  v_pin text := regexp_replace(coalesce(v_code, ''), '[\s-]', '', 'g');
  v_place text := nullif(left(btrim(coalesce(p_place, '')), 200), '');
  v_details text := nullif(left(btrim(coalesce(p_details, '')), 1000), '');
  v_code_id uuid;
begin
  if p_kind not in ('suspected_fake', 'tampered_seal', 'wrong_details', 'expired_on_sale', 'other') then
    raise exception 'invalid report kind';
  end if;
  if v_code is null and v_place is null and v_details is null then
    raise exception 'empty report';
  end if;

  -- Simple guard against floods from one account.
  if v_uid is not null and (
    select count(*) from public.product_reports where user_id = v_uid and created_at > now() - interval '1 day'
  ) >= 20 then
    raise exception 'too many reports';
  end if;

  if v_code is not null then
    select c.id into v_code_id
      from public.codes c
     where c.qr_hash = public.code_hash(v_code)
        or (v_pin ~ '^[0-9]{12}$' and c.pin_hash = public.code_hash(v_pin))
     limit 1;
  end if;

  insert into public.product_reports (user_id, code_id, code_input, kind, place, details)
  values (v_uid, v_code_id, v_code, p_kind, v_place, v_details);

  return true;
end;
$$;

revoke execute on function public.submit_report(text, text, text, text) from public;
grant execute on function public.submit_report(text, text, text, text) to anon, authenticated;
