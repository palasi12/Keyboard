# Email templates

Two systems send email here, and they are configured in different places.

| Email | Sent by | Configured in |
|---|---|---|
| Confirm signup | Supabase | Supabase dashboard, using the files here |
| Reset password | Supabase | Supabase dashboard, using the files here |
| Order confirmation | Resend | Resend dashboard (template `order-confirmation`) |
| Launch announcement | Resend | Resend dashboard (template `launch-announcement`) |

## Installing the Supabase ones

1. Supabase dashboard → **Authentication → Emails**
2. Pick **Confirm signup**, paste the contents of `confirm-signup.html`
3. Pick **Reset password**, paste the contents of `reset-password.html`
4. Save

Leave the `{{ .ConfirmationURL }}` placeholders exactly as they are — Supabase
fills them in. They are not the same syntax as the Resend templates, which use
`{{{TRIPLE_BRACES}}}`.

## Before these are worth anything

**Set the Site URL first.** Supabase → Authentication → URL Configuration. It
still points at localhost, so every link in these emails currently sends people
to their own machine.

**Supabase's built-in email is rate-limited** — a handful of messages per hour,
and it sends from a Supabase address. Fine for testing, not for customers. Once
you own a domain, point Supabase's SMTP settings at Resend and these same
templates go out branded.

## Why the emails are light, not dark

The site is near-black. These are not. Dark-background email is unreliable —
Gmail and Outlook apply their own dark-mode inversion and frequently mangle it,
and some clients strip background colours entirely, which can leave white text
on white. The dark header keeps the brand present without betting the whole
email on it.

Archivo is listed first in every `font-family`, with Arial behind it. Most email
clients will not load a web font, so assume most recipients see Arial.
