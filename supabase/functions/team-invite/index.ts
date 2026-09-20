/**
 * Creates a teammate account.
 *
 * Runs as an Edge Function because creating a user needs the service-role key,
 * which must never reach the browser. A service-role key in client JavaScript
 * is a full database bypass for anyone who opens devtools.
 *
 * The caller's own JWT is verified first and checked against is_admin(). The
 * service-role client is only touched after that passes, so this endpoint
 * cannot be used by a signed-in non-admin to mint accounts.
 *
 * Deploy:
 *   supabase functions deploy team-invite
 *
 * SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are injected
 * by the platform. Do not paste any of them into this file.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.46.1';

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

const EMAIL_SHAPE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const ROLES = new Set(['owner', 'founder']);

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (request.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  const url = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!url || !anonKey || !serviceKey) {
    console.error('Supabase environment is incomplete');
    // Deliberately vague: never leak configuration state to a caller.
    return json({ error: 'unavailable' }, 500);
  }

  const authHeader = request.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) return json({ error: 'not signed in' }, 401);

  // Step 1 — who is calling, and are they an admin? This runs as the caller,
  // so is_admin() sees their identity and RLS still applies.
  const caller = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });

  const { data: userData, error: userError } = await caller.auth.getUser();
  if (userError || !userData?.user) return json({ error: 'not signed in' }, 401);

  const { data: isAdmin, error: adminError } = await caller.rpc('is_admin');
  if (adminError || isAdmin !== true) return json({ error: 'not an admin' }, 403);

  // Step 2 — validate the request before touching the privileged client.
  let payload: { email?: unknown; full_name?: unknown; role?: unknown };
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'invalid body' }, 400);
  }

  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  const fullName = typeof payload.full_name === 'string' ? payload.full_name.trim() : '';
  const role = typeof payload.role === 'string' ? payload.role : 'founder';

  if (!EMAIL_SHAPE.test(email)) return json({ error: 'That email address is not valid.' }, 400);
  if (fullName.length > 120) return json({ error: 'That name is too long.' }, 400);
  if (!ROLES.has(role)) return json({ error: 'Unknown role.' }, 400);

  // Step 3 — create the account. inviteUserByEmail emails a set-password link,
  // so no password is ever chosen for someone else or sent over the wire.
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  const redirectTo = `${new URL(request.url).origin.replace(/\.functions\./, '.')}/reset-password`;
  const siteRedirect = Deno.env.get('SITE_URL')
    ? `${Deno.env.get('SITE_URL')}/reset-password`
    : redirectTo;

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName },
    redirectTo: siteRedirect,
  });

  if (inviteError) {
    const message = inviteError.message.toLowerCase();
    if (message.includes('already been registered') || message.includes('already exists')) {
      return json({ error: 'Someone with that email already has an account.' }, 409);
    }
    console.error('invite failed', inviteError.message);
    return json({ error: 'Could not send that invite.' }, 500);
  }

  const newUser = invited?.user;
  if (!newUser) return json({ error: 'Could not send that invite.' }, 500);

  // The trigger in the migration creates the profile row. Fill in the parts
  // the trigger cannot know, and do not fail the invite if this does not land
  // — the account exists either way, and the profile can be edited after.
  const { error: profileError } = await admin
    .from('profiles')
    .upsert(
      { id: newUser.id, email, full_name: fullName, role },
      { onConflict: 'id' },
    );

  if (profileError) console.error('profile upsert failed', profileError.message);

  return json({ ok: true, id: newUser.id, email });
});
