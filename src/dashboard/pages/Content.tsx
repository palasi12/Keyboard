/**
 * Content (handoff §5.8) — half real, half sample.
 *
 * The devlog is the old /admin/updates editor rebuilt in the new system, and
 * it keeps every capability it had: create, edit, publish, unpublish, delete,
 * slug derivation from the title, and the Postgres errors turned into plain
 * English. Those posts are real rows in Supabase.
 *
 * The posting streak, reach and platform cards below it are the handoff's
 * sample set — nothing here is wired to TikTok or Instagram — so each of
 * those cards carries its own SAMPLE DATA chip rather than the page carrying
 * one for everything.
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
  SampleChip,
  Skeleton,
  Toggle,
} from '../ui';
import { AreaChart, Sparkline } from '../ui/charts';
import {
  deleteUpdate,
  formatUpdateDate,
  saveUpdate,
  toSlug,
  type Update,
  type UpdateDraft,
} from '../../lib/updates';
import { useUpdates } from '../lib/useLiveData';
import { PLATFORMS, REACH_SERIES, WHAT_WORKS } from '../mock';
import { compact, number } from '../lib/format';
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

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function Content() {
  const updates = useUpdates();

  const [draft, setDraft] = useState<UpdateDraft | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string>();
  const [error, setError] = useState<string>();

  // Sample state (§7): the streak cells and the 14-slot calendar.
  const [days, setDays] = useState<boolean[]>([true, true, false, true, true, false, false]);
  const [calendar, setCalendar] = useState<(0 | 1 | 2)[]>([
    2, 2, 0, 2, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0,
  ]);

  const published = updates.data.filter((update) => update.published);
  const drafts = updates.data.filter((update) => !update.published);

  const streak = days.filter(Boolean).length;
  const posted = calendar.filter((slot) => slot === 2).length;
  const planned = calendar.filter((slot) => slot === 1).length;

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
        description="The devlog is live. The reach and streak cards below are sample."
        actions={
          <Button icon={Plus} variant="primary" onClick={startNew}>
            New post
          </Button>
        }
      />

      <PageBody
        rail={
          <>
            <Card pad={16}>
              <CardTitle action={<SampleChip />}>Best performing</CardTitle>
              <p className="text-[12.5px] font-bold text-ink-1">Dial mapping in 20s</p>
              <p className="mt-[2px] text-[10.5px] text-ink-4">TikTok · 9.1k views</p>
            </Card>

            <Card pad={16}>
              <CardTitle action={<SampleChip />}>What works</CardTitle>
              <ul className="flex flex-col gap-[9px]">
                {WHAT_WORKS.map((line) => (
                  <li key={line} className="flex gap-[8px] text-[11.5px] text-ink-2">
                    <span className="mt-[6px] h-[4px] w-[4px] shrink-0 rounded-full bg-lime" aria-hidden="true" />
                    {line}
                  </li>
                ))}
              </ul>
            </Card>

            <Card pad={16}>
              <CardTitle action={<SampleChip />}>Posts to waitlist</CardTitle>
              <p className="dash-metric-md">1.8</p>
              <p className="mt-[3px] text-[10.5px] text-ink-4">signups per post</p>
              <div className="mt-[10px]">
                <Sparkline data={REACH_SERIES} height={38} ariaLabel="Reach over the last seven days" />
              </div>
            </Card>
          </>
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
          <Kpi label="Reach this week" value={compact(19_100)} delta="64%" sub="Sample" />
          <Kpi label="Posting streak" value={`${streak} / 7`} sub="Sample" />
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

        {/* ------------------------------------------------------ social --- */}

        <div className="flex flex-col gap-[14px] lg:flex-row">
          <Card pad={18} className="flex-1">
            <CardTitle action={<SampleChip />}>Posting streak</CardTitle>
            <div className="flex gap-[6px]">
              {days.map((on, index) => (
                <button
                  key={index}
                  type="button"
                  aria-pressed={on}
                  aria-label={`Day ${index + 1}, ${on ? 'posted' : 'not posted'}`}
                  onClick={() =>
                    setDays((current) => current.map((value, i) => (i === index ? !value : value)))
                  }
                  className={cn(
                    'flex h-[44px] flex-1 items-center justify-center rounded-tile border text-[11px] font-bold transition',
                    on
                      ? 'on-lime border-transparent bg-lime-grad text-lime-ink shadow-lime-sm'
                      : 'border-line-strong bg-tile-grad text-ink-4',
                  )}
                >
                  {DAYS[index]}
                </button>
              ))}
            </div>
            <p className="mt-[12px] text-[12.5px] font-bold text-ink-1">{streak} / 7</p>
            <p className="mt-[3px] text-[11px] text-ink-4">
              {streak === 7
                ? 'The first clean week since the run started.'
                : `${7 - streak} missed this week.`}
            </p>
          </Card>

          <Card pad={18} className="flex-1">
            <CardTitle action={<SampleChip />}>Reach</CardTitle>
            <p className="dash-metric">{compact(19_100)}</p>
            <div className="mt-[10px]">
              <AreaChart
                data={REACH_SERIES}
                labels={DAYS}
                height={130}
                ariaLabel="Reach over the last seven days"
                formatValue={(value) => compact(value)}
              />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-3">
          {PLATFORMS.map((platform) => (
            <Card key={platform.name} pad={16}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-[12.5px] font-bold text-ink-1">{platform.name}</p>
                <SampleChip />
              </div>
              <p className="dash-metric-sm mt-[9px]">{compact(platform.reach)}</p>
              <p className="mt-[2px] text-[10.5px] text-ink-4">
                {number(platform.followers)} followers
              </p>
              <p className="mt-[9px] truncate text-[11px] text-ink-2" title={platform.best}>
                Best: {platform.best}
              </p>
            </Card>
          ))}
        </div>

        <Card pad={18}>
          <CardTitle action={<SampleChip />}>Calendar</CardTitle>
          <div className="grid grid-cols-7 gap-[6px]">
            {calendar.map((slot, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Slot ${index + 1}: ${
                  slot === 0 ? 'empty' : slot === 1 ? 'planned' : 'posted'
                }. Activate to cycle.`}
                onClick={() =>
                  setCalendar((current) =>
                    current.map((value, i) =>
                      i === index ? (((value + 1) % 3) as 0 | 1 | 2) : value,
                    ),
                  )
                }
                className={cn(
                  'flex h-[54px] items-center justify-center rounded-tile border text-[10.5px] font-bold transition',
                  slot === 2 && 'on-lime border-transparent bg-lime-grad text-lime-ink shadow-lime-sm',
                  slot === 1 && 'border-status-blue/40 bg-status-blue/[0.14] text-status-blue',
                  slot === 0 && 'border-line-strong bg-tile-grad text-ink-5',
                )}
              >
                {slot === 2 ? 'Posted' : slot === 1 ? 'Planned' : '+ Add'}
              </button>
            ))}
          </div>
          <p className="mt-[12px] text-[11px] text-ink-4">
            {posted} posted · {planned} planned · {calendar.length - posted - planned} open
          </p>
        </Card>
      </PageBody>
    </>
  );
}
