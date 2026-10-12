/**
 * Taptile email design system — one layout for every email we send.
 *
 * Matches the site: near-black ground, one glass card, white type, a white
 * pill button, mono labels. Built the way email has to be built: tables,
 * inline styles, bgcolor attributes for Outlook, no CSS the big clients drop.
 * Every email also gets a plain-text twin, which spam filters and screen
 * readers both care about.
 *
 * Pure string building, no imports and no runtime APIs, so the same file
 * renders in Edge Functions and in any local preview script.
 */

export const BRAND = {
  name: 'Taptile',
  site: 'https://www.trytaptile.com',
  support: 'support@trytaptile.com',
  from: 'Taptile <support@trytaptile.com>',
  team: 'Palasi & Jenil',
  teamRole: 'Founders, Taptile',
  logo: 'https://www.trytaptile.com/logo-cut.png',
  socials: [
    { name: 'Instagram', url: 'https://www.instagram.com/trytaptile/' },
    { name: 'TikTok', url: 'https://www.tiktok.com/@taptile0' },
    { name: 'YouTube', url: 'https://www.youtube.com/@trytaptile' },
  ],
} as const;

export interface Email {
  subject: string;
  html: string;
  text: string;
}

/** What the footer says, by kind of email. */
export type Footer =
  | { kind: 'account' }                         // sign-in, invites, codes
  | { kind: 'security' }                        // "something changed on your account"
  | { kind: 'list'; leaveUrl: string }          // waitlist and other list mail
  | { kind: 'order' };                          // receipts and shipping

export type Block =
  | { kind: 'p'; html: string; text?: string }            // html is trusted markup built with esc()
  | { kind: 'button'; label: string; url: string }
  | { kind: 'link'; url: string; lead?: string }           // the "or paste this link" fallback
  | { kind: 'code'; code: string; lead?: string }          // a one-time code
  | { kind: 'facts'; rows: [string, string][] }            // small key/value table
  | { kind: 'image'; src: string; alt: string; width: number; height: number }
  | { kind: 'note'; html: string; text?: string }          // small muted line
  | { kind: 'signoff' }                                    // "Palasi & Jenil, Founders"
  | { kind: 'divider' };

export interface Message {
  subject: string;
  preheader: string;          // the grey line inboxes show after the subject
  label: string;              // mono kicker above the headline
  heading: string;
  blocks: Block[];
  footer: Footer;
}

/* ---------------------------------------------------------------- tokens -- */
const C = {
  ground: '#000000',
  card: '#0b0b0d',
  well: '#141418',
  line: '#232328',
  ink: '#ffffff',
  body: '#b4b4ba',
  mute: '#85858c',
  faint: '#5f5f66',
};
const SANS = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
const MONO = "'JetBrains Mono', 'SFMono-Regular', Menlo, Consolas, 'Courier New', monospace";

/** Escape anything that came from outside (an email address, a name). */
export function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Strip our own markup for the plain-text twin. */
function plain(html: string): string {
  return html
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&middot;/g, '·');
}

const td = (style: string, inner: string, extra = '') => `<td ${extra} style="${style}">${inner}</td>`;
const table = (inner: string, attrs = '') =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" ${attrs}>${inner}</table>`;

/* ----------------------------------------------------------------- blocks -- */
function blockHtml(b: Block): string {
  switch (b.kind) {
    case 'p':
      return `<tr>${td(`padding-top:0;padding-bottom:16px;font-family:${SANS};font-size:15px;line-height:24px;color:${C.body};`, b.html)}</tr>`;
    case 'note':
      return `<tr>${td(`padding-top:0;padding-bottom:14px;font-family:${SANS};font-size:13px;line-height:20px;color:${C.mute};`, b.html)}</tr>`;
    case 'button':
      return `<tr><td style="padding-top:8px;padding-bottom:26px;">${table(
        `<tr><td align="center" bgcolor="#ffffff" style="background-color:#ffffff;border-radius:999px;">` +
          `<a href="${esc(b.url)}" target="_blank" style="display:inline-block;padding-top:14px;padding-bottom:14px;padding-left:26px;padding-right:26px;font-family:${SANS};font-size:15px;line-height:18px;font-weight:700;color:#050506;text-decoration:none;border-radius:999px;">${esc(b.label)}&nbsp;&nbsp;&rarr;</a>` +
          `</td></tr>`,
      )}</td></tr>`;
    case 'link':
      return `<tr>${td(
        `padding-top:0;padding-bottom:18px;font-family:${SANS};font-size:12px;line-height:18px;color:${C.faint};`,
        `${esc(b.lead ?? 'Button not working? Paste this into your browser:')}<br><a href="${esc(b.url)}" target="_blank" style="color:${C.mute};text-decoration:underline;word-break:break-all;">${esc(b.url)}</a>`,
      )}</tr>`;
    case 'code':
      return `<tr><td style="padding-top:4px;padding-bottom:22px;">${b.lead ? `<p style="margin:0 0 10px 0;font-family:${SANS};font-size:13px;line-height:20px;color:${C.mute};">${esc(b.lead)}</p>` : ''}${table(
        `<tr><td bgcolor="${C.well}" style="background-color:${C.well};border:1px solid ${C.line};border-radius:14px;padding-top:16px;padding-bottom:16px;padding-left:22px;padding-right:22px;font-family:${MONO};font-size:30px;line-height:36px;letter-spacing:8px;font-weight:700;color:${C.ink};">${esc(b.code)}</td></tr>`,
      )}</td></tr>`;
    case 'facts':
      return `<tr><td style="padding-top:2px;padding-bottom:22px;">${table(
        b.rows
          .map(
            ([k, v], i) =>
              `<tr>${td(`padding-top:${i ? 10 : 0}px;padding-bottom:10px;border-bottom:1px solid ${C.line};font-family:${MONO};font-size:11px;line-height:16px;letter-spacing:1.6px;text-transform:uppercase;color:${C.mute};`, esc(k), 'width="38%" valign="top"')}${td(`padding-top:${i ? 10 : 0}px;padding-bottom:10px;border-bottom:1px solid ${C.line};font-family:${SANS};font-size:14px;line-height:20px;color:${C.ink};`, esc(v), 'valign="top"')}</tr>`,
          )
          .join(''),
        'width="100%"',
      )}</td></tr>`;
    case 'image':
      return `<tr><td style="padding-top:4px;padding-bottom:24px;"><img src="${esc(b.src)}" alt="${esc(b.alt)}" width="${b.width}" height="${b.height}" border="0" style="display:block;width:100%;max-width:${b.width}px;height:auto;border-radius:14px;"></td></tr>`;
    case 'signoff':
      return `<tr>${td(`padding-top:4px;padding-bottom:22px;font-family:${SANS};font-size:15px;line-height:22px;font-weight:600;color:${C.ink};`, `${esc(BRAND.team)}<br><span style="font-size:13px;line-height:20px;font-weight:400;color:${C.mute};">${esc(BRAND.teamRole)}</span>`)}</tr>`;
    case 'divider':
      return `<tr><td style="padding-top:6px;padding-bottom:22px;"><div style="height:1px;line-height:1px;font-size:1px;background-color:${C.line};">&nbsp;</div></td></tr>`;
  }
}

function blockText(b: Block): string {
  switch (b.kind) {
    case 'p':
    case 'note':
      return (b.text ?? plain(b.html)) + '\n';
    case 'button':
      return `${b.label}: ${b.url}\n`;
    case 'link':
      return '';            // the button line already carries the URL
    case 'code':
      return `${b.lead ? b.lead + '\n' : ''}${b.code}\n`;
    case 'facts':
      return b.rows.map(([k, v]) => `${k}: ${v}`).join('\n') + '\n';
    case 'image':
      return '';
    case 'signoff':
      return `${BRAND.team}\n${BRAND.teamRole}\n`;
    case 'divider':
      return '---\n';
  }
}

/* ----------------------------------------------------------------- footer -- */
function footerLines(f: Footer): { html: string[]; text: string[] } {
  const support = `<a href="mailto:${BRAND.support}" style="color:${C.mute};text-decoration:underline;">${BRAND.support}</a>`;
  const html: string[] = [];
  const text: string[] = [];
  switch (f.kind) {
    case 'account':
      html.push(`Stuck, or got a question? Just reply &mdash; it comes straight to us at ${support}.`);
      text.push(`Stuck, or got a question? Just reply — it comes straight to us at ${BRAND.support}.`);
      break;
    case 'security':
      html.push(`We send a quick note like this whenever something changes on your account, so nothing happens without you knowing. Worried? Reply and we'll help &mdash; ${support}.`);
      text.push(`We send a quick note like this whenever something changes on your account. Worried? Reply and we'll help — ${BRAND.support}.`);
      break;
    case 'list':
      html.push(`You're getting this because you joined the Taptile waitlist. Not for you anymore? <a href="${esc(f.leaveUrl)}" style="color:${C.mute};text-decoration:underline;">Leave the list</a> &mdash; one click, no hard feelings.`);
      text.push(`You're getting this because you joined the Taptile waitlist. Not for you anymore? Leave the list (one click, no hard feelings): ${f.leaveUrl}`);
      break;
    case 'order':
      html.push(`Anything not right with your order? Reply to this email and one of us will sort it out personally &mdash; ${support}.`);
      text.push(`Anything not right with your order? Reply to this email and one of us will sort it out personally — ${BRAND.support}.`);
      break;
  }
  return { html, text };
}

/* ----------------------------------------------------------------- render -- */
export function render(m: Message): Email {
  const f = footerLines(m.footer);
  const socials = BRAND.socials
    .map((s) => `<a href="${s.url}" target="_blank" style="color:${C.mute};text-decoration:none;">${s.name}</a>`)
    .join(`<span style="color:${C.faint};">&nbsp;&nbsp;&middot;&nbsp;&nbsp;</span>`);

  const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>${esc(m.subject)}</title>
<!--[if !mso]><!--><link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&amp;family=JetBrains+Mono:wght@500;700&amp;display=swap" rel="stylesheet"><!--<![endif]-->
<style>
:root { color-scheme: dark; supported-color-schemes: dark; }
@media only screen and (max-width: 480px) {
  .tt-card { padding-top: 26px !important; padding-left: 22px !important; padding-right: 22px !important; }
  .tt-h1 { font-size: 24px !important; line-height: 30px !important; }
}
</style>
</head>
<body bgcolor="${C.ground}" style="margin:0;padding:0;background-color:${C.ground};-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.ground};font-size:1px;line-height:1px;">${esc(m.preheader)}${'&nbsp;&zwnj;'.repeat(40)}</div>
${table(
  `<tr><td align="center" style="padding-top:36px;padding-bottom:36px;padding-left:14px;padding-right:14px;">
${table(
  // logo row
  `<tr><td style="padding-top:0;padding-bottom:22px;padding-left:6px;">${table(
    `<tr><td valign="middle" style="padding-right:10px;"><a href="${BRAND.site}" target="_blank"><img src="${BRAND.logo}" alt="" width="30" height="30" border="0" style="display:block;width:30px;height:30px;"></a></td>` +
      td(`font-family:${SANS};font-size:17px;line-height:22px;font-weight:700;letter-spacing:-0.2px;color:${C.ink};`, `<a href="${BRAND.site}" target="_blank" style="color:${C.ink};text-decoration:none;">Taptile</a>`, 'valign="middle"') +
      `</tr>`,
  )}</td></tr>` +
  // the card
  `<tr><td class="tt-card" bgcolor="${C.card}" style="background-color:${C.card};border:1px solid ${C.line};border-radius:22px;padding-top:34px;padding-bottom:14px;padding-left:34px;padding-right:34px;">${table(
    `<tr>${td(`padding-bottom:12px;font-family:${MONO};font-size:11px;line-height:16px;letter-spacing:2px;text-transform:uppercase;color:${C.mute};`, esc(m.label))}</tr>` +
      `<tr>${td(`padding-bottom:18px;font-family:${SANS};font-size:28px;line-height:34px;font-weight:700;letter-spacing:-0.6px;color:${C.ink};`, esc(m.heading), 'class="tt-h1"')}</tr>` +
      m.blocks.map(blockHtml).join('\n'),
    'width="100%"',
  )}</td></tr>` +
  // footer
  `<tr><td style="padding-top:24px;padding-left:8px;padding-right:8px;">${table(
    f.html.map((l) => `<tr>${td(`padding-bottom:12px;font-family:${SANS};font-size:12px;line-height:19px;color:${C.faint};`, l)}</tr>`).join('') +
      `<tr>${td(`padding-bottom:12px;font-family:${SANS};font-size:12px;line-height:19px;`, socials)}</tr>` +
      `<tr>${td(`padding-bottom:0;font-family:${MONO};font-size:10px;line-height:16px;letter-spacing:1.6px;text-transform:uppercase;color:${C.faint};`, `Taptile &middot; New Zealand &middot; <a href="${BRAND.site}" target="_blank" style="color:${C.faint};text-decoration:none;">trytaptile.com</a>`)}</tr>`,
    'width="100%"',
  )}</td></tr>`,
  'width="100%" style="max-width:560px;"',
)}
</td></tr>`,
  `width="100%" bgcolor="${C.ground}" style="background-color:${C.ground};"`,
)}
</body>
</html>`;

  const text = [
    `TAPTILE — ${m.label.toUpperCase()}`,
    '',
    m.heading,
    '',
    ...m.blocks.map(blockText).filter(Boolean),
    '—',
    ...f.text,
    BRAND.socials.map((s) => `${s.name}: ${s.url}`).join('\n'),
    `Taptile · New Zealand · ${BRAND.site}`,
  ].join('\n');

  return { subject: m.subject, html, text };
}
