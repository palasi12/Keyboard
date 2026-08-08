import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env['VITE_SUPABASE_URL'] as string | undefined;
const anonKey = import.meta.env['VITE_SUPABASE_ANON_KEY'] as string | undefined;

/**
 * True when the app has real credentials.
 *
 * We deliberately do NOT fall back to a fake "logged in" state when this is
 * false. A login screen that accepts anything is worse than no login screen —
 * it looks finished, so it ships, and then it is a security hole nobody
 * remembers putting there. Instead the UI shows a clear setup notice.
 */
export const isSupabaseConfigured =
  typeof url === 'string' &&
  url.length > 0 &&
  !url.includes('your-project-ref') &&
  typeof anonKey === 'string' &&
  anonKey.length > 0 &&
  !anonKey.includes('your-anon');

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/** Turn Supabase's error strings into something a human can act on. */
export function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) {
    return 'That email and password combination does not match an account.';
  }
  if (m.includes('email not confirmed')) {
    return 'Check your inbox and confirm your email address first.';
  }
  if (m.includes('user already registered')) {
    return 'An account with that email already exists. Try signing in instead.';
  }
  if (m.includes('password should be at least')) {
    return 'Password is too short — use at least 8 characters.';
  }
  if (m.includes('rate limit') || m.includes('too many')) {
    return 'Too many attempts. Wait a minute and try again.';
  }
  return message;
}
