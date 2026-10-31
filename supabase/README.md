# Supabase setup

## Migrations

Run the files in `migrations/` in order in the Supabase SQL Editor (or with the Supabase CLI later).

## Auth settings (Authentication in the dashboard)

**URL Configuration**

- Site URL: `http://localhost:3000` while developing, the production domain at launch.
- Redirect URLs: add `http://localhost:3000/auth/callback` (and the production equivalent).

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
