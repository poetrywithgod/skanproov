# Supabase setup

## Migrations

Run the files in `migrations/` in order in the Supabase SQL Editor (or with the Supabase CLI later):

1. `20261031120000_profiles.sql`: people and their profiles.
2. `20261101200000_verification.sql`: manufacturers, products, batches, codes, scans, points, notifications and the `verify_product` check.

### Test data (development projects only)

`seed.sql` adds a made-up manufacturer, product and sample codes so the scanner has something real to
verify. Run it once, never in production. Codes to try: backup PIN `123456789012`, QR payload
`DEMO-GENUINE` (more: `DEMO-GENUINE-2` to `-5`, `DEMO-RECALLED`, `DEMO-EXPIRED`, `DEMO-UNRELEASED`).

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
