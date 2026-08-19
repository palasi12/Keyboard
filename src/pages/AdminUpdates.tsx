/**
 * Admin editor for development updates.
 *
 * Reachable at /admin/updates. The route is wrapped in ProtectedRoute so a
 * signed-out visitor gets bounced, but that is only convenience: the real gate
 * is the row-level security policy on `updates`, which calls is_admin(). A
 * signed-in non-admin who reaches this page sees an empty list and every save
 * is refused by Postgres.
 */

import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  deleteUpdate,
  fetchAllUpdates,
  formatUpdateDate,
  saveUpdate,
  toSlug,
  type Update,
  type UpdateDraft,
} from '../lib/updates';
import { checkIsAdmin } from '../lib/admin';
import Seo from '../components/Seo';

const BLANK: UpdateDraft = {
  slug: '',
  title: '',
  excerpt: '',
  body: '',
  author: '',
  cover: '',
  tags: [],
  published: false,
};

export default function AdminUpdates() {
  const [isAdmin, setIsAdmin] = useState<boolean>();
  const [updates, setUpdates] = useState<Update[]>([]);
  const [draft, setDraft] = useState<UpdateDraft | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [status, setStatus] = useState<string>();
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    const result = await fetchAllUpdates();
    setUpdates(result.updates);
    if (result.error) setError(result.error);
  }, []);

  useEffect(() => {
    void (async () => {
      const admin = await checkIsAdmin();
      setIsAdmin(admin);
      if (admin) await reload();
    })();
  }, [reload]);

  function edit(update: Update) {
    setDraft({
      id: update.id,
      slug: update.slug,
      title: update.title,
      excerpt: update.excerpt,
      body: update.body,
      author: update.author,
      cover: update.cover,
      tags: update.tags,
      published: update.published,
    });
    setSlugTouched(true); // never re-derive the slug of a published post
    setStatus(undefined);
    setError(undefined);
  }

  function startNew() {
    setDraft({ ...BLANK });
    setSlugTouched(false);
    setStatus(undefined);
    setError(undefined);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!draft) return;
    setSaving(true);
    setError(undefined);
    setStatus(undefined);

    const result = await saveUpdate(draft);
    setSaving(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    setStatus(draft.published ? 'Published.' : 'Saved as a draft.');
    setDraft(null);
    await reload();
  }

  async function remove(update: Update) {
    // Deleting a post is not undoable, so make the confirmation name it.
    if (!window.confirm(`Delete "${update.title}"? This cannot be undone.`)) return;
    const ok = await deleteUpdate(update.id);
    if (!ok) {
      setError('Could not delete that post.');
      return;
    }
    setStatus('Deleted.');
    await reload();
  }

  if (isAdmin === undefined) {
    return (
      <section className="mx-auto max-w-shell px-5 py-24">
        <p className="text-neutral-500" role="status">
          Checking access…
        </p>
      </section>
    );
  }

  if (!isAdmin) {
    return (
      <section className="mx-auto max-w-2xl px-5 py-24 text-center">
        <Seo title="Admin" description="Taptile admin." />
        <h1 className="text-2xl font-heading text-neutral-100">Not an admin account</h1>
        <p className="mt-3 text-neutral-400">
          This account is not on the admin list. Sign in with an admin address.
        </p>
        <Link to="/" className="btn-primary mt-6">
          Back to the site
        </Link>
      </section>
    );
  }

  const field =
    'w-full rounded-lg border border-hairline bg-white/[0.02] px-3 py-2 text-neutral-100 ' +
    'placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none';

  return (
    <section className="mx-auto max-w-shell px-5 py-14">
      <Seo title="Manage updates" description="Taptile admin — development updates." />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading tracking-heading text-neutral-100">
            Development updates
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            {updates.length} post{updates.length === 1 ? '' : 's'} ·{' '}
            {updates.filter((u) => !u.published).length} draft
            {updates.filter((u) => !u.published).length === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin" className="btn-secondary">
            Waitlist
          </Link>
          <button type="button" onClick={startNew} className="btn-primary">
            New post
          </button>
        </div>
      </div>

      {status && (
        <p className="mt-6 rounded-lg border border-hairline bg-white/[0.03] px-4 py-3 text-sm text-neutral-200">
          {status}
        </p>
      )}
      {error && (
        <p className="mt-6 rounded-lg border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-neutral-100">
          {error}
        </p>
      )}

      {draft && (
        <form onSubmit={submit} className="card mt-8 space-y-4 p-6">
          <h2 className="font-heading text-xl text-neutral-100">
            {draft.id ? 'Edit post' : 'New post'}
          </h2>

          <label className="block">
            <span className="text-sm text-neutral-400">Title</span>
            <input
              className={`${field} mt-1`}
              value={draft.title}
              required
              onChange={(e) => {
                const title = e.target.value;
                setDraft((d) =>
                  d ? { ...d, title, slug: slugTouched ? d.slug : toSlug(title) } : d,
                );
              }}
            />
          </label>

          <label className="block">
            <span className="text-sm text-neutral-400">
              URL — trytaptile.com/updates/<span className="text-neutral-200">{draft.slug || '…'}</span>
            </span>
            <input
              className={`${field} mt-1 font-mono text-sm`}
              value={draft.slug}
              required
              onChange={(e) => {
                setSlugTouched(true);
                setDraft((d) => (d ? { ...d, slug: toSlug(e.target.value) } : d));
              }}
            />
          </label>

          <label className="block">
            <span className="text-sm text-neutral-400">
              Excerpt — shown on the index and when the link is shared
            </span>
            <textarea
              className={`${field} mt-1`}
              rows={2}
              value={draft.excerpt}
              onChange={(e) => setDraft((d) => (d ? { ...d, excerpt: e.target.value } : d))}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm text-neutral-400">Author</span>
              <input
                className={`${field} mt-1`}
                value={draft.author}
                onChange={(e) => setDraft((d) => (d ? { ...d, author: e.target.value } : d))}
              />
            </label>
            <label className="block">
              <span className="text-sm text-neutral-400">Cover image path</span>
              <input
                className={`${field} mt-1 font-mono text-sm`}
                placeholder="/updates/case-v1.jpg"
                value={draft.cover}
                onChange={(e) => setDraft((d) => (d ? { ...d, cover: e.target.value } : d))}
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm text-neutral-400">Tags — comma separated</span>
            <input
              className={`${field} mt-1`}
              placeholder="hardware, prototype"
              value={draft.tags.join(', ')}
              onChange={(e) =>
                setDraft((d) => (d ? { ...d, tags: e.target.value.split(',') } : d))
              }
            />
          </label>

          <label className="block">
            <span className="text-sm text-neutral-400">Body — markdown</span>
            <textarea
              className={`${field} mt-1 font-mono text-sm leading-relaxed`}
              rows={18}
              value={draft.body}
              onChange={(e) => setDraft((d) => (d ? { ...d, body: e.target.value } : d))}
            />
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={draft.published}
              onChange={(e) => setDraft((d) => (d ? { ...d, published: e.target.checked } : d))}
              className="h-4 w-4 accent-accent"
            />
            <span className="text-sm text-neutral-300">
              Published — visible to everyone. Leave off to keep it a draft.
            </span>
          </label>

          <div className="flex gap-2 pt-2">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : draft.published ? 'Save and publish' : 'Save draft'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setDraft(null)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="mt-10 space-y-3">
        {updates.length === 0 && (
          <p className="text-neutral-500">No posts yet. Create the first one.</p>
        )}

        {updates.map((update) => (
          <div
            key={update.id}
            className="card flex flex-wrap items-center justify-between gap-4 p-4"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate font-heading text-neutral-100">{update.title}</span>
                {!update.published && (
                  <span className="shrink-0 rounded-full border border-hairline px-2 py-0.5 text-[11px] text-neutral-400">
                    Draft
                  </span>
                )}
              </div>
              <p className="mt-1 truncate font-mono text-xs text-neutral-500">
                /updates/{update.slug} · {formatUpdateDate(update.published_at)}
              </p>
            </div>

            <div className="flex shrink-0 gap-2">
              <Link to={`/updates/${update.slug}`} className="btn-secondary py-1.5 text-sm">
                View
              </Link>
              <button
                type="button"
                onClick={() => edit(update)}
                className="btn-secondary py-1.5 text-sm"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => void remove(update)}
                className="btn-secondary py-1.5 text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
