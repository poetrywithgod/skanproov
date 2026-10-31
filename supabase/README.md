# Supabase setup

## Migrations

Run the files in `migrations/` in order in the Supabase SQL Editor (or with the Supabase CLI later).

## Auth settings (Authentication in the dashboard)

**URL Configuration**

- Site URL: `http://localhost:3000` while developing, the production domain at launch.
- Redirect URLs: add `http://localhost:3000/auth/callback` (and the production equivalent).

**Email Templates → Confirm signup**

The confirmation link must go to `/auth/confirm` with a token hash. This makes the link work
in any browser or app, not only the one used to sign up. Set the message body to:

```html
<h2>Confirm your email address</h2>
<p>Follow the link below to confirm this email address and finish signing up.</p>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">Confirm email address</a></p>
```

Keep the template's other parts (subject, footer) as you like. `{{ .SiteURL }}` comes from the Site URL
above, so it follows the environment.

## E-mail sending

Supabase's built-in sender is for testing only and is heavily rate-limited. Before real users
arrive, set up custom SMTP (Authentication → Emails → SMTP Settings).
