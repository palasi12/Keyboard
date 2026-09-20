/**
 * Team profiles.
 *
 * Creating an account needs the service-role key, so it goes through the
 * `team-invite` Edge Function rather than happening here. Everything else is a
 * plain table read under row-level security.
 */

import { supabase } from './supabase';

export type TeamRole = 'owner' | 'founder';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: TeamRole;
  created_at: string;
}

/** A display name that is never blank — falls back to the email local part. */
export function displayName(profile: Pick<Profile, 'full_name' | 'email'>): string {
  const name = profile.full_name.trim();
  if (name) return name;
  const local = profile.email.split('@')[0] ?? profile.email;
  return local;
}

export async function fetchProfiles(): Promise<{ profiles: Profile[]; error?: string }> {
  if (!supabase) return { profiles: [], error: 'Not connected to Supabase.' };

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, created_at')
    .order('created_at', { ascending: true });

  if (error) {
    if (error.code === '42P01') {
      return { profiles: [], error: 'The profiles table does not exist yet. Run the migration.' };
    }
    return { profiles: [], error: 'Could not load the team.' };
  }
  return { profiles: (data ?? []) as Profile[] };
}

/**
 * Invite a teammate. They get an email with a set-password link; no password
 * is ever chosen on their behalf.
 */
export async function inviteTeammate(input: {
  email: string;
  full_name: string;
  role: TeamRole;
}): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'Not connected to Supabase.' };

  const { data: session } = await supabase.auth.getSession();
  const token = session.session?.access_token;
  if (!token) return { ok: false, error: 'Your session expired. Sign in again.' };

  try {
    const { data, error } = await supabase.functions.invoke('team-invite', {
      body: input,
    });

    if (error) {
      // The function returns a readable message in the body for the cases a
      // person can act on; surface that rather than "non-2xx status code".
      const context = (error as { context?: Response }).context;
      if (context && typeof context.json === 'function') {
        try {
          const body = await context.json();
          if (typeof body?.error === 'string') return { ok: false, error: body.error };
        } catch {
          /* fall through to the generic message */
        }
      }
      return { ok: false, error: 'Could not send that invite.' };
    }

    if (data && data.ok === false && typeof data.error === 'string') {
      return { ok: false, error: data.error };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: 'Could not reach the invite function. Is it deployed?' };
  }
}

export async function updateOwnName(fullName: string): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'Not connected to Supabase.' };
  const { data: session } = await supabase.auth.getSession();
  const id = session.session?.user.id;
  if (!id) return { ok: false, error: 'Your session expired. Sign in again.' };

  const { error } = await supabase
    .from('profiles')
    .update({ full_name: fullName.trim() })
    .eq('id', id);

  if (error) return { ok: false, error: 'Could not save that name.' };
  return { ok: true };
}
