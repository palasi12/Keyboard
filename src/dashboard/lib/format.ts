/**
 * Number and date formatting for the dashboard.
 *
 * Everything routes through Intl. Manual string math on money is how you end
 * up with "$1,2340" in a screenshot, and the handoff calls for en-NZ.
 */

const NZ = 'en-NZ';

/** `$2,340`. Cents are dropped unless they are actually there. */
export function currency(value: number, opts: { cents?: boolean } = {}): string {
  const cents = opts.cents ?? !Number.isInteger(value);
  return new Intl.NumberFormat(NZ, {
    style: 'currency',
    currency: 'NZD',
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  }).format(value);
}

/**
 * Compact past five digits — `$3.13M`, `325.6k`. The full precision belongs in
 * the tooltip, never lost.
 */
export function compactCurrency(value: number): string {
  if (Math.abs(value) < 100_000) return currency(value);
  return new Intl.NumberFormat(NZ, {
    style: 'currency',
    currency: 'NZD',
    currencyDisplay: 'narrowSymbol',
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(value);
}

export function compact(value: number): string {
  if (Math.abs(value) < 10_000) return new Intl.NumberFormat(NZ).format(value);
  return new Intl.NumberFormat(NZ, { notation: 'compact', maximumFractionDigits: 1 }).format(
    value,
  );
}

export function number(value: number): string {
  return new Intl.NumberFormat(NZ).format(value);
}

export function percent(value: number, digits = 0): string {
  return `${value.toFixed(digits)}%`;
}

/** `18 Sep` — the form every table in the artboards uses. */
export function shortDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(NZ, { day: 'numeric', month: 'short' }).format(date);
}

export function longDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(NZ, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function dateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(NZ, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/** "3 days ago". Used for signup recency, never for anything load-bearing. */
export function relative(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const days = Math.round((then - Date.now()) / 86_400_000);
  const rtf = new Intl.RelativeTimeFormat(NZ, { numeric: 'auto' });
  if (Math.abs(days) < 1) return 'today';
  if (Math.abs(days) < 30) return rtf.format(days, 'day');
  return rtf.format(Math.round(days / 30), 'month');
}
