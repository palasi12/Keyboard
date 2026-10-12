/**
 * Supabase Auth "Send Email" hook.
 *
 * Supabase calls this instead of sending its own plain emails, for every
 * account email: confirm signup, team invite, magic link, password reset,
 * email change (both addresses), verification codes, and the security
 * notices (password / email / phone changed, sign-in method added or
 * removed, two-step sign-in on or off). Each goes out through Resend from
 * support@trytaptile.com in the Taptile design.
 *
 * Setup (once):
 *   Dashboard → Authentication → Hooks → Send Email → HTTPS →
 *     https://jjndhbyawnbohobjwzue.supabase.co/functions/v1/auth-email
 *   Generate the secret there, and store it as the Edge Function secret
 *   SEND_EMAIL_HOOK_SECRET. Deploy with verify_jwt off: Supabase signs the
 *   request itself and this function checks that signature.
 */
import { Webhook } from 'npm:standardwebhooks@1.0.0';
import { authEmails, type AuthEmailData, type AuthUser } from '../_shared/email/templates.ts';
import { sendEmail } from '../_shared/email/send.ts';

function reply(status: number, message?: string): Response {
  // Supabase reads { error: { http_code, message } } and shows the message
  // in its logs; an empty 200 means "sent".
  const body = message ? { error: { http_code: status, message } } : {};
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return reply(405, 'Method not allowed');

  const secret = (Deno.env.get('SEND_EMAIL_HOOK_SECRET') ?? '').replace('v1,whsec_', '');
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  if (!secret) {
    console.error('auth-email: SEND_EMAIL_HOOK_SECRET is not set');
    return reply(500, 'Email hook is not configured');
  }

  const payload = await req.text();
  let user: AuthUser;
  let data: AuthEmailData;
  try {
    const verified = new Webhook(secret).verify(payload, Object.fromEntries(req.headers)) as {
      user: AuthUser;
      email_data: AuthEmailData;
    };
    user = verified.user;
    data = verified.email_data;
  } catch (err) {
    console.error('auth-email: signature check failed', err instanceof Error ? err.message : err);
    return reply(401, 'Invalid signature');
  }

  const emails = authEmails(user, data, supabaseUrl);
  if (emails.length === 0) {
    // Unknown type with nothing to link to: don't block the user's action.
    console.warn('auth-email: nothing to send for', data.email_action_type);
    return reply(200);
  }

  const results = await Promise.all(emails.map(sendEmail));
  const failed = results.filter((r) => !r.ok);
  if (failed.length) {
    console.error('auth-email: send failed', data.email_action_type, failed.map((f) => `${f.status} ${f.error}`).join(' | '));
    return reply(500, 'Could not send the email. Try again in a minute.');
  }

  console.log('auth-email: sent', data.email_action_type, results.map((r) => r.id).join(','));
  return reply(200);
});
