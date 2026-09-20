/**
 * Content (handoff §5.8) — half real, half sample.
 *
 * The devlog is the old /admin/updates editor rebuilt in the new system, and
 * it keeps every capability it had: create, edit, publish, unpublish, delete,
 * slug derivation from the title, and the Postgres errors turned into plain
 * English. Those posts are real rows in Supabase.
 *
 * The posting streak, reach, platform and calendar cards are gone. They were
 * the handoff's sample set and nothing was wired to TikTok or Instagram, so
 * every figure on them was invented. What is left is the devlog, which is
 * real.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageBody, PageHeader } from '../layout/AppShell';
import {
  Button,
  Card,
  CardTitle,
  EmptyState,
  ErrorCard,
  Field,
  Kpi,
  Pill,
  Skeleton,
  Toggle,
} from '../ui';
import {
  deleteUpdate,
  formatUpdateDate,
  saveUpdate,
  toSlug,
  type Update,
  type UpdateDraft,
} from '../../lib/updates';
import { useUpdates } from '../lib/useLiveData';
import { number } from '../lib/format';
import { cn } from '../lib/cn';
import { Play, Plus } from '../icons';

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

export default function Content() {
  const updates = useUpdates();

  const [draft, setDraft] = useState<UpdateDraft | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string>();
  const [error, setError] = useState<string>();

  const published = updates.data.filter((update) => update.published);
  const drafts = updates.data.filter((update) => !update.published);

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
    setSlugTouched(true); // never re-derive the slug of an existing post
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
    updates.reload();
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
    updates.reload();
  }

  return (
    <>
      <PageHeader
        title="Content"
        live
        description="Write, edit and publish development updates."
        actions={
          <Button icon={Plus} variant="primary" onClick={startNew}>
            New post
          </Button>
        }
      />

      <PageBody
        rail={
          <Card pad={16}>
            <CardTitle>Where these appear</CardTitle>
            <p className="text-[11.5px] leading-[1.6] text-ink-3">
              Published posts show on the public devlog at /updates. Drafts are invisible to
              visitors — row-level security refuses them to the anon key, so an unpublished post
              cannot leak by guessing its URL.
            </p>
          </Card>
        }
      >
        {updates.error && <ErrorCard message={updates.error} onRetry={updates.reload} />}
        {error && <ErrorCard message={error} />}
        {status && (
          <div className="rounded-card border border-line bg-panel-grad p-[14px] text-[12px] font-semibold text-lime shadow-card-sm">
            {status}
          </div>
        )}

        <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2 xl:grid-cols-4">
          <Kpi
            label="Published posts"
            value={updates.loading ? '—' : number(published.length)}
            sub="live on /updates"
          />
          <Kpi
            label="Drafts"
            value={updates.loading ? '—' : number(drafts.length)}
            sub="not visible yet"
          />
          <Kpi
            label="Total posts"
            value={updates.loading ? '—' : number(updates.data.length)}
            sub="published and draft"
          />
          <Kpi
            label="Latest"
            value={updates.loading || !updates.data[0] ? '—' : formatUpdateDate(updates.data[0].published_at)}
            sub={updates.data[0]?.title ?? 'nothing yet'}
          />
        </div>

        {/* ------------------------------------------------------ devlog --- */}

        {draft && (
          <Card pad={18} as="section">
            <form onSubmit={submit} className="flex flex-col gap-[14px]">
              <h2 className="dash-card-title">{draft.id ? 'Edit post' : 'New post'}</h2>

              <Field
                label="Title"
                value={draft.title}
                onChange={(title) =>
                  setDraft((current) =>
                    current
                      ? { ...current, title, slug: slugTouched ? current.slug : toSlug(title) }
                      : current,
                  )
                }
              />

              <Field
                label="URL"
                value={draft.slug}
                hint={`trytaptile.com/updates/${draft.slug || '…'}`}
                onChange={(slug) => {
                  setSlugTouched(true);
                  setDraft((current) => (current ? { ...current, slug: toSlug(slug) } : current));
                }}
              />

              <Field
                label="Excerpt"
                value={draft.excerpt}
                multiline
                rows={2}
                hint="Shown on the index and when the link is shared."
                onChange={(excerpt) =>
                  setDraft((current) => (current ? { ...current, excerpt } : current))
                }
              />

              <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2">
                <Field
                  label="Author"
                  value={draft.author}
                  onChange={(author) =>
                    setDraft((current) => (current ? { ...current, author } : current))
                  }
                />
                <Field
                  label="Cover image path"
                  value={draft.cover}
                  placeholder="/updates/case-v1.jpg"
                  onChange={(cover) =>
                    setDraft((current) => (current ? { ...current, cover } : current))
                  }
                />
              </div>

              <Field
                label="Tags"
                value={draft.tags.join(', ')}
                placeholder="hardware, prototype"
                hint="Comma separated."
                onChange={(value) =>
                  setDraft((current) =>
                    current ? { ...current, tags: value.split(',') } : current,
                  )
                }
              />

              <Field
                label="Body — markdown"
                value={draft.body}
                multiline
                rows={16}
                onChange={(body) =>
                  setDraft((current) => (current ? { ...current, body } : current))
                }
              />

              <Toggle
                checked={draft.published}
                onChange={(next) =>
                  setDraft((current) => (current ? { ...current, published: next } : current))
                }
                title="Published"
                description="Visible to everyone. Leave off to keep it a draft."
              />

              <div className="flex flex-wrap gap-[7px]">
                <Button type="submit" variant="primary" loading={saving}>
                  {draft.published ? 'Save and publish' : 'Save draft'}
                </Button>
                <Button onClick={() => setDraft(null)}>Cancel</Button>
              </div>
            </form>
          </Card>
        )}

        <Card pad={18}>
          <CardTitle
            action={
              <span className="text-[10.5px] font-semibold text-ink-4">
                {updates.data.length} post{updates.data.length === 1 ? '' : 's'} ·{' '}
                {drafts.length} draft{drafts.length === 1 ? '' : 's'}
              </span>
            }
          >
            Devlog
          </CardTitle>

          {updates.loading ? (
            <div className="flex flex-col gap-[10px]">
              {[0, 1, 2].map((index) => (
                <Skeleton key={index} height={44} />
              ))}
            </div>
          ) : updates.data.length === 0 ? (
            <EmptyState
              icon={Play}
              title="No posts yet"
              body="Write the first devlog entry. Drafts stay invisible until you publish them."
              cta={
                <Button variant="primary" icon={Plus} onClick={startNew}>
                  New post
                </Button>
              }
            />
          ) : (
            <div className="flex flex-col">
              {updates.data.map((update, index) => (
                <div
                  key={update.id}
                  className={cn(
                    'flex flex-wrap items-center gap-[10px] py-[13px]',
                    index < updates.data.length - 1 && 'border-b border-line-row',
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-[8px]">
                      <span
                        className="truncate text-[12.5px] font-bold text-ink-1"
                        title={update.title}
                      >
                        {update.title}
                      </span>
                      <Pill
                        tone={update.published ? 'lime' : 'grey'}
                        label={update.published ? 'Published' : 'Draft'}
                      />
                    </span>
                    <span className="mt-[3px] block truncate text-[10.5px] text-ink-4">
                      /updates/{update.slug} · {formatUpdateDate(update.published_at)}
                    </span>
                  </span>

                  <span className="flex shrink-0 gap-[7px]">
                    <Link
                      to={`/updates/${update.slug}`}
                      className="inline-flex h-[30px] items-center rounded-chip border border-line-strong bg-tile-grad px-[11px] text-[11.5px] font-semibold text-ink-2 transition hover:text-ink-1"
                    >
                      View
                    </Link>
                    <Button size="sm" onClick={() => edit(update)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => void remove(update)}>
                      Delete
                    </Button>
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

      </PageBody>
    </>
  );
}
