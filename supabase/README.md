# Supabase setup

## Migrations

Run the files in `migrations/` in order in the Supabase SQL Editor (or with the Supabase CLI later):

1. `20261031120000_profiles.sql`: people and their profiles.
2. `20261101200000_verification.sql`: manufacturers, products, batches, codes, scans, points, notifications and the `verify_product` check.
3. `20261102060000_reports.sql`: shopper reports ("report an issue") and the `submit_report` function.
4. `20261102070000_account_deletion.sql`: `delete_my_account` and a fix so deleting an account cannot free up its codes.
5. `20261102080000_mfa.sql`: makes two-factor sign-in enforceable at the database, not just in the app.
6. `20261102090000_geotagging.sql`: the optional "GPS scan geotagging" setting and `attach_scan_location`.
7. `20261103100000_retailer.sql`: retailers, branches, manufacturer connections, cartons and carton scanning.
8. `20261105090000_manufacturer_profiles.sql`: manufacturer profile details (registered name, RC number, address, categories, brands, contact) and `get_manufacturer`.
9. `20261112100000_manufacturer_registration.sql`: the "Register your Company" details, the private `manufacturer-documents` storage bucket, document upload functions and `submit_manufacturer_application` (replaces `apply_manufacturer`). Run it after `20261106090000_manufacturer_applications.sql`.
10. `20261113100000_manufacturer_portal.sql`: links a person to their manufacturer (`manufacturer_members`, `my_manufacturer`) and adds `approve_manufacturer_application`. Until the Super Admin app exists, approve a company by hand in the SQL Editor: `select public.approve_manufacturer_application('<application id>');` (find the id with `select id, company_name, status from public.manufacturer_applications;`).
11. `20261113150000_products.sql`: product details (SKU, category, brand, picture and so on), batch units, the public `product-images` bucket, and the functions behind the Products screens (`my_products`, `my_product`, `my_product_batches`, `save_product`). Run it after `20261113100000_manufacturer_portal.sql`.
12. `20261113200000_batches.sql`: batch details (number, facility, notes, certificate), the private `batch-certificates` bucket, and the functions behind the Batches screens (`my_batches`, `my_batch`, `declare_batch`, `release_batch`). Run it after `20261113150000_products.sql`.
13. `20261113220000_code_generation.sql`: code generation runs (`code_runs`), the private `code-files` bucket (CSV and label PDF, kept 30 days), and the functions `generate_codes`, `attach_code_run_files`, `discard_code_run`, `my_code_runs`, `claim_expired_code_files`. Codes are stored as hashes only. Needs the `pgcrypto` extension (Supabase keeps it in the `extensions` schema). Run it after `20261113200000_batches.sql`.
14. `20261113230000_code_generation_json.sql`: makes `generate_codes` return all codes as one JSON value, because the API cuts lists of rows at 1,000. Run it after `20261113220000_code_generation.sql`.
15. `20261114100000_manufacturer_notifications.sql`: the manufacturer's notifications (`manufacturer_notifications`, `my_notifications`, `set_notification_read`, `mark_all_notifications_read`) and updated versions of `declare_batch`, `release_batch`, `attach_code_run_files`, `claim_expired_code_files` and `approve_manufacturer_application` that write them. Run it after `20261113230000_code_generation_json.sql`.

### Test data (development projects only)

`seed.sql` adds a made-up manufacturer, product and sample codes so the scanner has something real to
verify. Run it once, never in production. Codes to try: backup PIN `123456789012`, QR payload
`DEMO-GENUINE` (more: `DEMO-GENUINE-2` to `-5`, `DEMO-RECALLED`, `DEMO-EXPIRED`, `DEMO-UNRELEASED`).

For the retailer app, also run `seed-retailer.sql` (after `seed.sql`). It adds sample cartons. Until the Super Admin app exists, approve a new branch in the SQL Editor: `update public.retailer_branches set status = 'approved', reviewed_at = now() where status = 'pending';`

## Auth settings (Authentication in the dashboard)

**URL Configuration**

- Site URL: `http://localhost:3000` while developing, the production domain at launch.
- Redirect URLs: add `http://localhost:3000/auth/callback` and `http://localhost:3000/auth/reset` (and the production equivalents). The second one is for password reset e-mails.

## Confirmation e-mail: current behaviour and the planned upgrade

Until the project has its own e-mail service (custom SMTP), Supabase's built-in sender is used and
its template cannot be edited. That e-mail links to `/auth/callback`, which signs the person in
automatically **only if the link is opened in the same browser where they signed up** (a Supabase
security feature called PKCE). In any other browser the e-mail address is still confirmed, but
the person is sent to the sign-in page and signs in with their password. The sign-in page says so.

When custom SMTP is set up (Authentication → Emails → SMTP Settings), switch to the cross-browser
link by setting the **Confirm signup** template body (Authentication → Email Templates) to:

```html
<h2>Confirm your email address</h2>
<p>Follow the link below to confirm this email address and finish signing up.</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Confirm email address</a></p>
```

The `/auth/confirm` route is already in the app and waits for this. `{{ .SiteURL }}` follows the
Site URL setting above, so it works in each environment.

## E-mail sending

Supabase's built-in sender is for testing only and is heavily rate-limited. Set up custom SMTP
before real users arrive.

## Password reset e-mail

Until custom SMTP is set up, the reset link only works when opened in the same browser that requested
it (same PKCE limit as sign-up). After SMTP, set the **Reset password** template (Authentication →
Email Templates) body to:

```html
<h2>Reset your password</h2>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery">Choose a new password</a></p>
```

The `/auth/confirm` route already handles `type=recovery`.
16. `20261116100000_team_management.sql`: Team Management. Four roles (admin, code_manager, compliance_officer, viewer; old `member` becomes `viewer`), member status (active/revoked), `manufacturer_invites` (link fingerprints only, 14 days), `manufacturer_activity` log, `role_can`, `require_permission`, `member_can`, `permission_matrix`, `team_overview`, `team_member_detail`, `invite_member`, `reissue_invite`, `cancel_invite`, `change_member_role`, `revoke_member`, `invite_preview`, `accept_manufacturer_invite`, `touch_member_seen`. `my_manufacturer` now also returns status and permissions. The existing product, batch and code functions are wrapped so they check the caller's role (each original becomes `<name>_core`), and the storage policies follow the same permissions. Run it after `20261114100000_manufacturer_notifications.sql`.
17. `20261117100000_overview.sql`: Overview screen. Adds `my_recent_activity(p_limit)`, which returns the latest team activity for the Recent activity panel (needs the view_audit_logs permission). Run it after `20261116100000_team_management.sql`.
18. `20261118100000_audit_logs.sql`: Audit Logs. Adds `audit_log` (one page of the activity log with filters and a total, for roles that can view audit logs), `audit_log_export` (the same without paging, up to 10,000 rows, for roles that can export; the export is logged) and `record_code_download` (logs CSV and label PDF downloads). Run it after `20261117100000_overview.sql`.
19. `20261119100000_settings.sql`: Settings. Adds the company contact columns (contact name, job title, phone, quality e-mail, website; existing companies are filled from their application), `my_company` (company profile and contact details for any active member) and `update_company_contact` (Administrator only, logged). The audit log filter also learns the new Settings group. Run it after `20261118100000_audit_logs.sql`.
20. `20261120100000_overview_scans.sql`: Overview scan activity and download links. Adds `my_scan_activity` (scans of the company's codes per day for the chart, for any active member), a `run_id` on activity entries so code-generation entries can link their files (`attach_code_run_files` now records it, and existing entries are filled in where they can be matched), and `my_recent_activity` now returns it. Run it after `20261119100000_settings.sql`.
21. `20261121100000_recall_revoke.sql`: Recall and revoke batches. Adds the reason, customer message, note and who/when columns on batches; `recall_batch`, `lift_recall`, `revoke_batch` (Administrator and Compliance Officer; each is logged and sends a notification); `batch_status_detail` for the batch page; and the verification functions (`verify_product`, `retailer_verify_carton`) now return the manufacturer's message on a recalled result. Run it after `20261120100000_overview_scans.sql`.
