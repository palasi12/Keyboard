/**
 * Runs the real email Edge Functions locally with Resend and the database
 * stubbed out, and checks every path: all 13 auth email types, signature
 * checks, the waitlist welcome and its abuse guards, and the leave flow.
 * Nothing is sent. Each email is also written to ./preview as .html + .txt.
 *
 *   deno run -A supabase/tests/email/run.ts auth
 *   deno run -A supabase/tests/email/run.ts waitlist
 *   deno run -A supabase/tests/email/run.ts leave
 *
 * (One suite per run: each one starts its function's server on port 8000.)
 */
import { sent, db, sign, realFetch } from './harness.ts';
import { leaveToken } from '../../functions/_shared/email/leave.ts';

const which = Deno.args[0];
if (!['auth', 'waitlist', 'leave'].includes(which ?? '')) {
  console.log('usage: deno run -A supabase/tests/email/run.ts <auth|waitlist|leave>');
  Deno.exit(2);
}
const port = 8000;
let fails = 0;
const ok = (c: boolean, m: string) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const out = new URL('./preview', import.meta.url).pathname;
await Deno.mkdir(out, { recursive: true });
const save = (name: string, m: any) => { Deno.writeTextFileSync(`${out}/${name}.html`, m.html); Deno.writeTextFileSync(`${out}/${name}.txt`, `Subject: ${m.subject}\nTo: ${m.to}\nFrom: ${m.from}\nReply-To: ${m.reply_to}\nTags: ${JSON.stringify(m.tags)}\nHeaders: ${JSON.stringify(m.headers ?? {})}\nIdempotency: ${m.idem}\n\n${m.text}`); };

if (which === 'auth') {
  await import('../../functions/auth-email/index.ts');
  const base = { token: '482913', token_hash: 'pkce_abc123hash', redirect_to: 'https://www.trytaptile.com/reset-password', site_url: 'https://www.trytaptile.com', token_new: '', token_hash_new: '' };
  const user = { email: 'palasi@example.com', user_metadata: { full_name: 'Palasi Thunder' } };
  const cases: [string, any, any, number][] = [
    ['signup', user, { ...base, redirect_to: 'https://www.trytaptile.com/' }, 1],
    ['invite', user, base, 1],
    ['magiclink', user, base, 1],
    ['recovery', user, base, 1],
    ['email_change', { ...user, new_email: 'new@example.com' }, { ...base, token_hash: 'hash_for_new', token_hash_new: 'hash_for_current', token_new: '111222' }, 2],
    ['reauthentication', user, { ...base, token_hash: '' }, 1],
    ['password_changed_notification', user, base, 1],
    ['email_changed_notification', { ...user, email: 'new@example.com' }, { ...base, old_email: 'palasi@example.com' }, 1],
    ['phone_changed_notification', user, base, 1],
    ['identity_linked_notification', user, { ...base, provider: 'google' }, 1],
    ['identity_unlinked_notification', user, { ...base, provider: 'google' }, 1],
    ['mfa_factor_enrolled_notification', user, { ...base, factor_type: 'totp' }, 1],
    ['mfa_factor_unenrolled_notification', user, { ...base, factor_type: 'totp' }, 1],
  ];
  for (const [type, u, d, n] of cases) {
    const before = sent.length;
    const body = JSON.stringify({ user: u, email_data: { ...d, email_action_type: type } });
    const res = await realFetch(`http://localhost:${port}/`, { method: 'POST', headers: sign(body), body });
    const txt = await res.text();
    const got = sent.slice(before);
    ok(res.status === 200 && txt === '{}' && got.length === n, `${type}: ${res.status} ${txt} sent=${got.length}`);
    got.forEach((m, i) => save(`auth-${type}${got.length > 1 ? '-' + (i ? 'new' : 'current') : ''}`, m));
    for (const m of got) {
      ok(m.from === 'Taptile <support@trytaptile.com>' && m.reply_to === 'support@trytaptile.com', `  from/reply_to ${m.to}`);
      ok(!/undefined|null|NaN|\$\{/.test(m.html + m.text + m.subject), `  no template leaks ${m.to}`);
    }
  }
  // email_change: right hash to right inbox
  const ec = sent.filter((m) => m.tags[0].value === 'auth-email_change');
  ok(ec[0].to[0] === 'palasi@example.com' && ec[0].html.includes('token=hash_for_current'), 'email_change current address gets token_hash_new');
  ok(ec[1].to[0] === 'new@example.com' && ec[1].html.includes('token=hash_for_new'), 'email_change new address gets token_hash');
  const rec = sent.find((m) => m.tags[0].value === 'auth-recovery');
  ok(rec.html.includes('https://proj.supabase.co/auth/v1/verify?token=pkce_abc123hash&amp;type=recovery&amp;redirect_to=https%3A%2F%2Fwww.trytaptile.com%2Freset-password'), 'recovery verify link');
  ok(rec.idem === 'auth-recovery-pkce_abc123hash', 'recovery idempotency key');
  // bad signature
  const body = JSON.stringify({ user, email_data: { ...base, email_action_type: 'recovery' } });
  const h = sign(body); h['webhook-signature'] = 'v1,AAAA';
  const bad = await realFetch(`http://localhost:${port}/`, { method: 'POST', headers: h, body });
  ok(bad.status === 401, `bad signature -> ${bad.status} ${await bad.text()}`);
  // tampered body
  const bad2 = await realFetch(`http://localhost:${port}/`, { method: 'POST', headers: sign(body), body: body.replace('palasi@', 'evil@') });
  ok(bad2.status === 401, `tampered body -> ${bad2.status} ${await bad2.text()}`);
  // resend failure surfaces
  const fb = JSON.stringify({ user: { email: 'fail@example.com' }, email_data: { ...base, email_action_type: 'recovery' } });
  const f = await realFetch(`http://localhost:${port}/`, { method: 'POST', headers: sign(fb), body: fb });
  ok(f.status === 500, `resend failure -> ${f.status} ${await f.text()}`);
  // escaping of hostile names
  const xb = JSON.stringify({ user: { email: 'x@example.com', user_metadata: { full_name: '<script>alert(1)</script>' } }, email_data: { ...base, email_action_type: 'invite' } });
  const before = sent.length;
  await (await realFetch(`http://localhost:${port}/`, { method: 'POST', headers: sign(xb), body: xb })).text();
  ok(!sent[before].html.includes('<script>'), 'hostile name escaped');
}

if (which === 'waitlist') {
  await import('../../functions/waitlist-confirmation/index.ts');
  const now = new Date().toISOString();
  db.rows = [
    { email: 'fresh@example.com', source: 'landing:Taptile Dialect', created_at: now },
    { email: 'old@example.com', source: 'landing:Taptile Dialect', created_at: '2026-01-01T00:00:00Z' },
    { email: 'odd@example.com', source: 'landing:<b>free money</b>', created_at: now },
  ];
  const post = (b: unknown) => realFetch(`http://localhost:${port}/`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) });
  let r = await post({ email: '  Fresh@Example.com ', interest: 'ignored' });
  ok(r.status === 200 && sent.length === 1, `fresh row sends (${r.status} ${await r.text()})`);
  const m = sent[0];
  save('waitlist-welcome', m);
  const t = await leaveToken('fresh@example.com');
  ok(m.to[0] === 'fresh@example.com' && m.from === 'Taptile <support@trytaptile.com>', 'to/from');
  ok(m.html.includes(`https://www.trytaptile.com/leave?e=fresh%40example.com&amp;t=${t}`), 'leave link in footer');
  ok(m.headers['List-Unsubscribe'].includes(`https://proj.supabase.co/functions/v1/waitlist-leave?e=fresh%40example.com&t=${t}`) && m.headers['List-Unsubscribe-Post'] === 'List-Unsubscribe=One-Click', 'one-click headers');
  ok(m.idem === 'waitlist-welcome-fresh@example.com', 'idempotency');
  r = await post({ email: 'old@example.com' }); await r.text();
  ok(sent.length === 1, 'old row does not resend');
  r = await post({ email: 'nobody@example.com' }); await r.text();
  ok(r.status === 200 && sent.length === 1, 'unknown address: 200, no send');
  r = await post({ email: 'odd@example.com' }); await r.text();
  ok(sent.length === 2 && !sent[1].html.includes('free money') && sent[1].html.includes('Taptile Dialect'), 'unknown board falls back');
  r = await post({ email: 'not-an-email' });
  ok(r.status === 400, `bad email -> ${r.status} ${await r.text()}`);
  r = await realFetch(`http://localhost:${port}/`, { method: 'OPTIONS' }); await r.text();
  ok(r.headers.get('access-control-allow-origin') === '*', 'CORS preflight');
}

if (which === 'leave') {
  await import('../../functions/waitlist-leave/index.ts');
  db.rows = [{ email: 'a@example.com' }, { email: 'b@example.com' }];
  const ta = await leaveToken('a@example.com');
  const tb = await leaveToken('b@example.com');
  let r = await realFetch(`http://localhost:${port}/?e=a%40example.com&t=${ta}`, { redirect: 'manual' }); await r.text();
  ok(r.status === 303 && r.headers.get('location') === `https://www.trytaptile.com/leave?e=a%40example.com&t=${ta}` && db.rows.length === 2, `GET redirects, removes nothing (${r.status})`);
  r = await realFetch(`http://localhost:${port}/?e=a%40example.com&t=${tb}`, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'List-Unsubscribe=One-Click' });
  ok(r.status === 403 && db.rows.length === 2, `wrong token rejected (${r.status} ${await r.text()})`);
  r = await realFetch(`http://localhost:${port}/?e=a%40example.com&t=${ta}`, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'List-Unsubscribe=One-Click' });
  ok(r.status === 200 && db.rows.length === 1, `one-click POST removes (${r.status} ${await r.text()})`);
  r = await realFetch(`http://localhost:${port}/`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ e: 'B@example.com', t: tb }) });
  ok(r.status === 200 && db.rows.length === 0, `JSON POST from /leave page removes (${r.status} ${await r.text()})`);
  r = await realFetch(`http://localhost:${port}/`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ e: 'b@example.com', t: tb }) });
  ok(r.status === 200 && (await r.json()).removed === false, 'second click is harmless');
}

console.log(fails ? `\n${fails} FAILED` : '\nALL PASS');
Deno.exit(fails ? 1 : 0);
