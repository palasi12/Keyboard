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

  // Fire the confirmation email. Deliberately not awaited: the address is
  // already saved, which is the part that matters, and blocking the success
  // state on an email send makes the form feel slow — or worse, shows an error
  // for something that actually worked.
  void sendConfirmation(trimmed, source);

  return { ok: true };
}

/**
 * Ask the edge function to send the "you're on the list" email.
 *
 * The function holds the Resend API key. It cannot live here: everything in
 * src/ is compiled into the bundle every visitor downloads.
 *
 * Silent on failure by design — a missed confirmation email is a small problem,
 * and telling someone their signup failed when it did not is a bigger one.
 */
async function sendConfirmation(email: string, source: string): Promise<void> {
  const projectUrl = import.meta.env['VITE_SUPABASE_URL'] as string | undefined;
  const anonKey = import.meta.env['VITE_SUPABASE_ANON_KEY'] as string | undefined;
  if (!projectUrl || !anonKey) return;

  // Source looks like "landing:Taptile Nano" — the part after the colon is
  // whichever board they picked.
  const interest = source.includes(':') ? source.slice(source.indexOf(':') + 1) : 'Not sure yet';

  try {
    await fetch(`${projectUrl}/functions/v1/waitlist-confirmation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify({ email, interest }),
    });
  } catch {
    /* nothing useful to do here — see the note above */
  }
}
