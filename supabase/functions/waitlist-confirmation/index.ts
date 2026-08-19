/**
 * Sends the waitlist confirmation email.
 *
 * Runs as a Supabase Edge Function because it needs the Resend API key, which
 * must never reach the browser. The site calls this; this calls Resend.
 *
 * Deploy:
 *   supabase secrets set RESEND_API_KEY=re_xxxxxxxx
 *   supabase functions deploy waitlist-confirmation
 *
 * The key is read from the environment at run time — do not paste it into this
 * file, and do not commit it anywhere.
 */

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const EMAIL_SHAPE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (request.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) {
    console.error('RESEND_API_KEY is not set');
    // Deliberately vague to the caller: never leak configuration state.
    return json({ ok: false }, 500);
  }

  let payload: { email?: unknown; interest?: unknown };
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'invalid body' }, 400);
  }

  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  const interest =
    typeof payload.interest === 'string' && payload.interest.trim()
      ? payload.interest.trim().slice(0, 40)
      : 'Not sure yet';

  if (!EMAIL_SHAPE.test(email) || email.length > 254) {
    return json({ error: 'invalid email' }, 400);
  }

  const response = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      // Stops a double-submit sending two identical emails.
      'Idempotency-Key': `waitlist-${email}`,
    },
    body: JSON.stringify({
      // Sender stays on the verified domain: Resend can only sign mail
      // for domains you control, and a gmail.com From would fail SPF and
      // DKIM and land in spam. reply_to is what gets a reply to a human.
      from: 'Taptile <hello@trytaptile.com>',
      reply_to: 'hello.taptile@gmail.com',
      to: [email],
      template: 'waitlist-confirmation',
      variables: {
        INTEREST: interest,
        CONFIGURATOR_URL: 'https://www.trytaptile.com/configurator',
        SITE_URL: 'https://www.trytaptile.com',
      },
    }),
  });

  if (!response.ok) {
    // Log the detail server-side; tell the caller nothing useful.
    console.error('resend send failed', response.status, await response.text());
    return json({ ok: false }, 502);
  }

  return json({ ok: true });
});
