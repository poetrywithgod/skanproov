-- SKANPROOV: manufacturer company registration (the "Register your Company" screen).
--
-- The sign-up page collects the company's details and creates the account. The details wait in the
-- person's sign-up data until they confirm their e-mail and sign in. They then upload their
-- verification documents, and "Submit for Verification" turns the details and documents into an
-- application for a Super Admin to review.
--
-- Documents live in a private storage bucket, in a folder named after the person's id. Nobody can
-- read another person's folder. Like the other tables, the document list is closed to the API and
-- read or changed only through functions.

-- 1. More company details on the application. Older applications (sent before this screen existed)
--    keep these empty, so the new columns allow nulls; the submit function below requires them.
alter table public.manufacturer_applications rename column nafdac_number to regulatory_number;

alter table public.manufacturer_applications
  add column company_email text check (company_email is null or char_length(company_email) between 5 and 254),
  add column company_phone text check (company_phone is null or company_phone ~ '^\+234[789][01][0-9]{8}$'),
  add column state text check (state is null or char_length(state) between 2 and 40),
  add column tin text check (tin is null or char_length(tin) between 6 and 20),
  add column year_incorporated int check (year_incorporated is null or year_incorporated between 1900 and 2100),
  add column staff_range text check (staff_range is null or staff_range in ('1-20', '21-50', '51-100', '101-250', '251+')),
  add column contact_name text check (contact_name is null or char_length(contact_name) between 2 and 120),
  add column contact_phone text check (contact_phone is null or contact_phone ~ '^\+234[789][01][0-9]{8}$'),
  add column contact_role text check (contact_role is null or char_length(contact_role) between 2 and 60);

-- 2. Verification documents.
create table public.manufacturer_documents (
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in (
    'registration_certificate', 'regulatory_certificate', 'tax_clearance', 'director_id', 'premises_photo'
  )),
  path text not null,
  file_name text not null check (char_length(file_name) between 1 and 200),
  size_bytes int not null check (size_bytes between 1 and 5242880),
  uploaded_at timestamptz not null default now(),
  primary key (user_id, kind)
);

revoke all on public.manufacturer_documents from anon, authenticated;
alter table public.manufacturer_documents enable row level security;

-- 3. The private bucket: PDF, JPG or PNG, up to 5 MB each.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('manufacturer-documents', 'manufacturer-documents', false, 5242880,
        array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

create policy manufacturer_documents_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'manufacturer-documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy manufacturer_documents_select on storage.objects for select to authenticated
  using (bucket_id = 'manufacturer-documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy manufacturer_documents_delete on storage.objects for delete to authenticated
  using (bucket_id = 'manufacturer-documents' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- 4. Record an uploaded document. The file itself is already in the bucket; this registers it.
--    Returns the path of the file it replaces (if any) so the app can delete the old one.
--    Documents are locked while an application is being reviewed or once it is approved.
create function public.add_manufacturer_document(p_kind text, p_path text, p_file_name text, p_size int)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_old text;
begin
  if v_uid is null then raise exception 'not signed in'; end if;
  if split_part(p_path, '/', 1) <> v_uid::text then raise exception 'wrong folder'; end if;
  if exists (
    select 1 from public.manufacturer_applications
     where user_id = v_uid and status in ('pending', 'approved')
  ) then
    raise exception 'application locked';
  end if;

  select path into v_old from public.manufacturer_documents where user_id = v_uid and kind = p_kind;

  insert into public.manufacturer_documents (user_id, kind, path, file_name, size_bytes)
  values (v_uid, p_kind, p_path, p_file_name, p_size)
  on conflict (user_id, kind)
  do update set path = excluded.path, file_name = excluded.file_name,
                size_bytes = excluded.size_bytes, uploaded_at = now();

  return v_old;
end;
$$;

-- Removes a document from the list; returns its path so the app can delete the file.
create function public.remove_manufacturer_document(p_kind text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_path text;
begin
  if v_uid is null then raise exception 'not signed in'; end if;
  if exists (
    select 1 from public.manufacturer_applications
     where user_id = v_uid and status in ('pending', 'approved')
  ) then
    raise exception 'application locked';
  end if;

  delete from public.manufacturer_documents where user_id = v_uid and kind = p_kind
  returning path into v_path;
  return v_path;
end;
$$;

create function public.my_manufacturer_documents()
returns table (kind text, file_name text, size_bytes int)
language sql
stable
security definer
set search_path = ''
as $$
  select d.kind, d.file_name, d.size_bytes
    from public.manufacturer_documents d
   where d.user_id = auth.uid();
$$;

-- 5. Submit for verification. Replaces apply_manufacturer.
--    p holds the company details (the app checks them first; the table's checks are the backstop).
--    A rejected application can be sent again: pass null to keep its details as they were.
drop function public.apply_manufacturer(text, text, text, text, text, text);

create function public.submit_manufacturer_application(p jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
  v_status text;
begin
  if v_uid is null then raise exception 'not signed in'; end if;
  if not exists (select 1 from public.profiles where id = v_uid) then
    raise exception 'no profile';
  end if;

  select id, status into v_id, v_status from public.manufacturer_applications where user_id = v_uid;
  if v_id is not null and v_status <> 'rejected' then
    raise exception 'already applied';
  end if;
  if v_id is null and p is null then
    raise exception 'no details';
  end if;

  if (select count(*) from public.manufacturer_documents
       where user_id = v_uid and kind in ('registration_certificate', 'director_id')) < 2 then
    raise exception 'missing documents';
  end if;

  if p is null then
    update public.manufacturer_applications
       set status = 'pending', review_note = null, reviewed_at = null, created_at = now()
     where id = v_id;
  elsif v_id is null then
    insert into public.manufacturer_applications (
      user_id, company_name, company_email, company_phone, address, state, city,
      rc_number, tin, regulatory_number, year_incorporated, staff_range, category,
      contact_name, contact_phone, contact_role
    ) values (
      v_uid, btrim(p ->> 'company'), btrim(p ->> 'companyEmail'), p ->> 'companyPhone',
      btrim(p ->> 'address'), btrim(p ->> 'state'), btrim(p ->> 'city'),
      btrim(p ->> 'rcNumber'), btrim(p ->> 'tin'), nullif(btrim(coalesce(p ->> 'regulatoryNumber', '')), ''),
      (p ->> 'yearIncorporated')::int, p ->> 'staffRange', btrim(p ->> 'category'),
      btrim(p ->> 'contactName'), p ->> 'contactPhone', btrim(p ->> 'contactRole')
    ) returning id into v_id;
  else
    update public.manufacturer_applications
       set company_name = btrim(p ->> 'company'), company_email = btrim(p ->> 'companyEmail'),
           company_phone = p ->> 'companyPhone', address = btrim(p ->> 'address'),
           state = btrim(p ->> 'state'), city = btrim(p ->> 'city'),
           rc_number = btrim(p ->> 'rcNumber'), tin = btrim(p ->> 'tin'),
           regulatory_number = nullif(btrim(coalesce(p ->> 'regulatoryNumber', '')), ''),
           year_incorporated = (p ->> 'yearIncorporated')::int, staff_range = p ->> 'staffRange',
           category = btrim(p ->> 'category'), contact_name = btrim(p ->> 'contactName'),
           contact_phone = p ->> 'contactPhone', contact_role = btrim(p ->> 'contactRole'),
           status = 'pending', review_note = null, reviewed_at = null, created_at = now()
     where id = v_id;
  end if;
  return v_id;
end;
$$;

revoke execute on function
  public.add_manufacturer_document(text, text, text, int),
  public.remove_manufacturer_document(text),
  public.my_manufacturer_documents(),
  public.submit_manufacturer_application(jsonb)
  from public, anon;
grant execute on function
  public.add_manufacturer_document(text, text, text, int),
  public.remove_manufacturer_document(text),
  public.my_manufacturer_documents(),
  public.submit_manufacturer_application(jsonb)
  to authenticated;
