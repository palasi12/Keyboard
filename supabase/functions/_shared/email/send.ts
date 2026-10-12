/**
 * The one place Taptile mail leaves the building.
 *
 * Resend signs and delivers it (DKIM on resend._domainkey.trytaptile.com);
 * replies go to support@trytaptile.com, which Google Workspace receives.
 * The API key is an Edge Function secret — never in code, never in the browser.
 */
import { BRAND } from './layout.ts';
import type { Outgoing } from './templates.ts';

export interface SendResult {
  ok: boolean;
  id?: string;
  status?: number;
  error?: string;
}

export async function sendEmail(o: Outgoing): Promise<SendResult> {
  const key = Deno.env.get('RESEND_API_KEY');
  if (!key) return { ok: false, error: 'RESEND_API_KEY is not set' };

  const headers: Record<string, string> = {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  };
  // Resend keeps idempotency keys for 24 hours: a retried request inside
  // that window returns the first email instead of sending a second.
  if (o.idempotencyKey) headers['Idempotency-Key'] = o.idempotencyKey.slice(0, 256);

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      from: BRAND.from,
      to: [o.to],
      reply_to: BRAND.support,
      subject: o.subject,
      html: o.html,
      text: o.text,
      ...(o.headers ? { headers: o.headers } : {}),
      // Tag values allow letters, numbers, _ and - only.
      tags: [{ name: 'category', value: o.tag.replace(/[^A-Za-z0-9_-]/g, '_') }],
    }),
  });

  const body = await res.text();
  if (!res.ok) {
    console.error('resend send failed', o.tag, res.status, body);
    return { ok: false, status: res.status, error: body };
  }
  try {
    return { ok: true, id: (JSON.parse(body) as { id?: string }).id };
  } catch {
    return { ok: true };
  }
}
