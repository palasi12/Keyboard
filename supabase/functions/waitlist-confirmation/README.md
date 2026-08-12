# waitlist-confirmation

Sends the "you're on the list" email when someone joins the waitlist.

## Why it is a server function

Sending through Resend needs the API key. Anything in `src/` is compiled into
the JavaScript every visitor downloads, so the key cannot live there — a
published key is a key anyone can send mail with, from your domain.

## Deploy

```bash
supabase login
supabase link --project-ref jjndhbyawnbohobjwzue
supabase secrets set RESEND_API_KEY=re_your_key_here
supabase functions deploy waitlist-confirmation
```

Create the key at resend.com → API Keys, with **Sending access** only.

## Then wire the site to it

In `src/lib/waitlist.ts`, after the `join_waitlist` RPC succeeds, add:

```ts
void fetch(
  'https://jjndhbyawnbohobjwzue.supabase.co/functions/v1/waitlist-confirmation',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: trimmed, interest }),
  },
).catch(() => {
  // A failed confirmation email must never fail the signup — the address is
  // already saved, which is the part that matters.
});
```

Deliberately not awaited: the person is on the list either way, and blocking
the success state on an email send makes the form feel slow and can show an
error for something that already worked.
