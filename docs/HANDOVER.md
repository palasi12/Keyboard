# What only you can do

Everything in here needs a browser login or a payment method, so it can't be
done from a chat session. Roughly in order of how much it matters.

## 1. Supabase auth URLs — blocking

Right now a real signup is broken: the confirmation link points at localhost,
so the account never activates.

Supabase dashboard → **Authentication → URL Configuration**

- Site URL: `https://www.trytaptile.com`
- Redirect URLs: `https://www.trytaptile.com/**`

Then → **Authentication → Emails**, paste in:

- `docs/email/confirm-signup.html` into "Confirm signup"
- `docs/email/reset-password.html` into "Reset password"

Test it by signing up with a real address and clicking the link.

## 2. Contact address — resolved

The contact address is `hello.taptile@gmail.com`: a real Gmail inbox, so mail
sent to it actually arrives. It is what the footer, the privacy policy and the
terms all point at.

`hello@trytaptile.com` remains the Resend **sender** and nothing else. That
split is deliberate — Resend can only sign mail for a domain you control, so a
`gmail.com` From address would fail SPF and DKIM and get filtered as spoofed.
The edge function sets `reply_to` to the Gmail address, so a reply to the
waitlist confirmation reaches a person.

Still open: `hello@trytaptile.com` has no inbox, so anyone mailing the address
on the old business cards gets nothing. Cloudflare Email Routing (free) will
forward it to the Gmail in about ten minutes.

## 3. Waitlist confirmation email

Template is built and published in Resend (`waitlist-confirmation`). The edge
function that sends it is written but not deployed — it needs the Resend API
key, which only you can create.

See `supabase/functions/waitlist-confirmation/README.md`. Three commands.

Until this is deployed, people join the list and hear nothing back.

## 4. The supplier question — the actual business risk

Ella Peng quoted $12.99 at 300 units with custom logos, but did not answer:

- What chip does the keypad use?
- Does it support QMK with VIA?
- Neutral packaging at 300pcs?

Without the firmware answer, the configurator may not work with the hardware at
all, and the configurator is the only part of this that is yours.

300 × $12.99 ≈ $3,900 before shipping, duties and GST.

## 5. Clean up the account tangle

- GitHub → repo Settings → Collaborators → remove `propalasi80-debug`
  (it was a workaround for the old Vercel account; it still has write access)
- Register `propalasi60@gmail.com` at github.com/settings/emails, or accept that
  a few commits won't link to your profile

## 6. Before anyone can legally buy anything

- Returns policy — 14-day cooling off is required in the UK and EU
- Terms of sale, privacy policy, delivery timescales
- VAT position confirmed with an accountant
- Stripe endpoint — see `docs/CHECKOUT.md`
- Vercel Pro (~$20/mo) — Hobby is non-commercial

## Done and needing nothing from you

- Domain verified in Resend, sending works (tested)
- Three templates published: waitlist confirmation, order confirmation, launch
- Waitlist capturing real signups, admin dashboard at `/admin`
- Configurator built — untested on hardware, see `docs/CONFIGURATOR.md`
- Favicon, social preview, SEO, mobile nav, password reset
