/**
 * Signed "leave the list" links.
 *
 * The token is an HMAC of the address, so a link only works for the inbox it
 * was sent to — nobody can remove someone else by guessing. The key is
 * derived from the project's service role key, which every Edge Function
 * already has, so there is no extra secret to manage. (If that key is ever
 * rotated, old links stop working and the /leave page points people to
 * support@ instead.)
 */
import { BRAND } from './layout.ts';

const enc = new TextEncoder();

async function hmacKey(): Promise<CryptoKey> {
  const root = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!root) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  const material = await crypto.subtle.digest('SHA-256', enc.encode(`taptile:waitlist-leave:v1:${root}`));
  return crypto.subtle.importKey('raw', material, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}

function b64url(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function leaveToken(email: string): Promise<string> {
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(), enc.encode(normaliseEmail(email)));
  return b64url(new Uint8Array(sig).slice(0, 18)); // 144 bits, 24 characters
}

export async function checkLeaveToken(email: string, token: string): Promise<boolean> {
  const expected = await leaveToken(email);
  if (token.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ token.charCodeAt(i);
  return diff === 0;
}

/** The link people click: a page on the site with a "Leave" button. */
export async function leavePageUrl(email: string): Promise<string> {
  const q = new URLSearchParams({ e: normaliseEmail(email), t: await leaveToken(email) });
  return `${BRAND.site}/leave?${q.toString()}`;
}

/**
 * Headers for Gmail's and Apple Mail's own "Unsubscribe" button (RFC 8058).
 * The mail client POSTs straight to the function, so no page is needed.
 */
export async function listUnsubscribeHeaders(email: string): Promise<Record<string, string>> {
  const supabaseUrl = (Deno.env.get('SUPABASE_URL') ?? '').replace(/\/$/, '');
  const q = new URLSearchParams({ e: normaliseEmail(email), t: await leaveToken(email) });
  return {
    'List-Unsubscribe': `<${supabaseUrl}/functions/v1/waitlist-leave?${q.toString()}>, <mailto:${BRAND.support}?subject=Leave%20the%20waitlist>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  };
}
