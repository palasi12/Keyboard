/**
 * Waitlist signup.
 *
 * Goes through the `join_waitlist` RPC rather than inserting into the table
 * directly. The table has RLS on with no policies, so the anon key cannot read
 * or write it — the function is the only door, and it returns nothing.
 *
 * That is deliberate: a plain insert policy would let anyone probe for
 * duplicate-key errors and work out whether a given address had signed up.
 */

import { supabase } from './supabase';

export interface WaitlistResult {
  ok: boolean;
  error?: string;
}

const EMAIL_SHAPE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function joinWaitlist(email: string, source = 'landing'): Promise<WaitlistResult> {
  const trimmed = email.trim();

  if (!EMAIL_SHAPE.test(trimmed)) {
    return { ok: false, error: 'That does not look like a valid email address.' };
  }
  if (trimmed.length > 254) {
    return { ok: false, error: 'That email address is too long.' };
  }
  if (!supabase) {
    return {
      ok: false,
      error: 'Signups are not connected yet. Add your Supabase keys to .env.local.',
    };
  }

  const { error } = await supabase.rpc('join_waitlist', {
    p_email: trimmed,
    p_source: source,
  });

  if (error) {
    // Never surface a raw Postgres error to a visitor.
    if (error.message.includes('invalid_email')) {
      return { ok: false, error: 'That does not look like a valid email address.' };
    }
    return { ok: false, error: 'Could not save that just now. Please try again in a moment.' };
  }

  return { ok: true };
}
