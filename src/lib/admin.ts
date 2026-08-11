/**
 * Admin checks.
 *
 * The client-side answer here is only for deciding what to render. The real
 * gate is the row-level security policy on `waitlist`, which calls the same
 * `is_admin()` function in the database. Someone who fakes the client-side flag
 * still gets an empty list back, because Postgres refuses the rows.
 */

import { supabase } from './supabase';

export interface WaitlistEntry {
  id: string;
  email: string;
  source: string;
  created_at: string;
}

export async function checkIsAdmin(): Promise<boolean> {
  if (!supabase) return false;
  const { data, error } = await supabase.rpc('is_admin');
  if (error) return false;
  return data === true;
}

export async function fetchWaitlist(): Promise<{
  entries: WaitlistEntry[];
  error?: string;
}> {
  if (!supabase) return { entries: [], error: 'Not connected to Supabase.' };

  const { data, error } = await supabase
    .from('waitlist')
    .select('id, email, source, created_at')
    .order('created_at', { ascending: false });

  if (error) return { entries: [], error: 'Could not load the waitlist.' };
  return { entries: (data ?? []) as WaitlistEntry[] };
}

export async function removeFromWaitlist(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from('waitlist').delete().eq('id', id);
  return !error;
}

/**
 * Build a CSV of the signups.
 *
 * Fields are quoted and any leading =, +, - or @ is prefixed with a quote, so
 * a crafted signup cannot turn into a live formula when the file is opened in
 * Excel. This is a real attack, not a hypothetical one.
 */
export function toCsv(entries: WaitlistEntry[]): string {
  const escape = (value: string): string => {
    const neutralised = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
    return `"${neutralised.replace(/"/g, '""')}"`;
  };

  const header = ['email', 'source', 'signed_up_at'].join(',');
  const rows = entries.map((entry) =>
    [escape(entry.email), escape(entry.source), escape(entry.created_at)].join(','),
  );
  return [header, ...rows].join('\n');
}
