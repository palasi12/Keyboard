/**
 * Development updates.
 *
 * Posts live in the `updates` table in Supabase, not in markdown files. They
 * used to be files in git, which is simpler to host but means publishing needs
 * a commit and a deploy — you cannot write a post from a browser. Moving them
 * into the database is what makes /admin able to create and edit them.
 *
 * Visibility is enforced by row-level security, not here. The public policy on
 * `updates` only returns rows where published = true, so a draft is invisible
 * to the anon key no matter what this file does. The admin functions below
 * work only because the admin policy calls the same is_admin() the waitlist
 * page uses — a faked client-side flag still gets refused by Postgres.
 */

import { supabase } from './supabase';

export interface Update {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  author: string;
  cover: string;
  tags: string[];
  published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

/** What the editor sends back. id is absent when creating. */
export type UpdateDraft = Pick<
  Update,
  'slug' | 'title' | 'excerpt' | 'body' | 'author' | 'cover' | 'tags' | 'published'
> & { id?: string };

const COLUMNS =
  'id, slug, title, excerpt, body, author, cover, tags, published, published_at, created_at, updated_at';

function sortKey(update: Update): string {
  return update.published_at ?? update.created_at;
}

/** Published posts, newest first. Used by the public /updates pages. */
export async function fetchUpdates(): Promise<{ updates: Update[]; error?: string }> {
  if (!supabase) return { updates: [], error: 'Not connected to Supabase.' };

  const { data, error } = await supabase
    .from('updates')
    .select(COLUMNS)
    .eq('published', true)
    .order('published_at', { ascending: false, nullsFirst: false });

  if (error) return { updates: [], error: 'Could not load updates.' };
  return { updates: (data ?? []) as Update[] };
}

/**
 * One post by slug.
 *
 * Deliberately does not filter on published: an admin previewing a draft
 * should see it, and a visitor cannot, because RLS already refused the row.
 * The distinction between "no such post" and "not published yet" is therefore
 * invisible to visitors, which is the correct behaviour.
 */
export async function fetchUpdateBySlug(
  slug: string,
): Promise<{ update?: Update; error?: string }> {
  if (!supabase) return { error: 'Not connected to Supabase.' };

  const { data, error } = await supabase
    .from('updates')
    .select(COLUMNS)
    .eq('slug', slug)
    .maybeSingle();

  if (error) return { error: 'Could not load that post.' };
  return { update: (data ?? undefined) as Update | undefined };
}

// ----------------------------------------------------------------- admin ---

/** Every post including drafts. Returns nothing useful unless you are an admin. */
export async function fetchAllUpdates(): Promise<{ updates: Update[]; error?: string }> {
  if (!supabase) return { updates: [], error: 'Not connected to Supabase.' };

  const { data, error } = await supabase.from('updates').select(COLUMNS);
  if (error) return { updates: [], error: 'Could not load updates.' };

  const updates = ((data ?? []) as Update[]).sort((a, b) =>
    sortKey(b).localeCompare(sortKey(a)),
  );
  return { updates };
}

export async function saveUpdate(draft: UpdateDraft): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'Not connected to Supabase.' };

  const row = {
    slug: draft.slug.trim(),
    title: draft.title.trim(),
    excerpt: draft.excerpt.trim(),
    body: draft.body,
    author: draft.author.trim(),
    cover: draft.cover.trim(),
    tags: draft.tags.map((tag) => tag.trim()).filter(Boolean),
    published: draft.published,
  };

  const { error } = draft.id
    ? await supabase.from('updates').update(row).eq('id', draft.id)
    : await supabase.from('updates').insert(row);

  if (!error) return { ok: true };

  // Turn the two Postgres failures an admin will actually hit into plain
  // English, rather than surfacing a constraint name.
  if (error.code === '23505') {
    return { ok: false, error: 'A post with that URL already exists.' };
  }
  if (error.message.includes('updates_slug_shape')) {
    return {
      ok: false,
      error: 'The URL can only use lowercase letters, numbers and hyphens.',
    };
  }
  if (error.message.includes('updates_title_present')) {
    return { ok: false, error: 'The post needs a title.' };
  }
  return { ok: false, error: 'Could not save. You may not have admin access.' };
}

export async function deleteUpdate(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from('updates').delete().eq('id', id);
  return !error;
}

// ------------------------------------------------------------- utilities ---

/** "case prototype v2" -> "case-prototype-v2", matching the DB constraint. */
export function toSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function formatUpdateDate(date: string | null): string {
  if (!date) return 'Draft';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '';
  return new Intl.DateTimeFormat('en-NZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parsed);
}
