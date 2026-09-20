/**
 * Messages (handoff §5.9).
 *
 * Three panes on desktop; under 1024 the list and the thread stack, and the
 * selected thread opens in place. Opening a thread clears its unread badge,
 * which is what the sidebar count is derived from.
 */

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageBody, PageHeader } from '../layout/AppShell';
import { Avatar, Button, Card, CardTitle, Chip, Pill, SearchField } from '../ui';
import { REPLY_TEMPLATES, THREADS, type Thread } from '../mock';
import { cn } from '../lib/cn';
import { Mail, Plus } from '../icons';

type Filter = 'all' | 'unread' | 'supplier';

const KIND_TONE = { customer: 'lime', supplier: 'blue', system: 'grey' } as const;

export default function Messages() {
  const [selected, setSelected] = useState(0);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [read, setRead] = useState<number[]>([]);
  const [composer, setComposer] = useState('');
  const [sent, setSent] = useState<Record<number, { text: string; time: string; outgoing: boolean }[]>>(
    {},
  );

  const unreadOf = (index: number) => (read.includes(index) ? 0 : THREADS[index]!.unread);
  const totalUnread = THREADS.reduce((sum, _, index) => sum + unreadOf(index), 0);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return THREADS.map((thread, index) => ({ thread, index })).filter(({ thread, index }) => {
      if (filter === 'unread' && unreadOf(index) === 0) return false;
      if (filter === 'supplier' && thread.kind !== 'supplier') return false;
      if (!needle) return true;
      return (
        thread.name.toLowerCase().includes(needle) ||
        thread.preview.toLowerCase().includes(needle)
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, query, read]);

  const thread: Thread = THREADS[selected]!;
  const messages = [...thread.messages, ...(sent[selected] ?? [])];

  function open(index: number) {
    setSelected(index);
    setRead((current) => (current.includes(index) ? current : [...current, index]));
  }

  function send() {
    const text = composer.trim();
    if (!text) return;
    const time = new Intl.DateTimeFormat('en-NZ', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date());
    setSent((current) => ({
      ...current,
      [selected]: [...(current[selected] ?? []), { text, time, outgoing: true }],
    }));
    setComposer('');
  }

  return (
    <>
      <PageHeader
        title="Messages"
        description="Customers, suppliers and filing notices in one place."
        actions={
          <Pill
            tone={totalUnread > 0 ? 'lime' : 'grey'}
            label={totalUnread > 0 ? `${totalUnread} unread` : 'All read'}
          />
        }
      />

      <PageBody
        rail={
          <>
            <Card pad={16}>
              <CardTitle>About</CardTitle>
              <div className="flex items-center gap-[10px]">
                <Avatar name={thread.name} size={34} />
                <span className="min-w-0">
                  <span className="block truncate text-[12.5px] font-bold text-ink-1">
                    {thread.name}
                  </span>
                  <span className="block truncate text-[10.5px] text-ink-4">{thread.role}</span>
                </span>
              </div>
              <div className="mt-[12px] flex flex-col gap-[8px]">
                <Pill tone={KIND_TONE[thread.kind]} label={thread.kind} />
                <p className="truncate text-[11px] text-ink-3" title={thread.email}>
                  {thread.email}
                </p>
                <p className="text-[11px] text-ink-4">{thread.place}</p>
              </div>
            </Card>

            <Card pad={16}>
              <CardTitle>Linked record</CardTitle>
              <Link
                to={thread.link.href}
                className="flex items-center gap-[10px] rounded-tile border border-line-strong bg-tile-grad p-[11px] transition hover:brightness-110"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[12.5px] font-bold text-ink-1">
                    {thread.link.value}
                  </span>
                  <span className="block truncate text-[10.5px] text-ink-4">{thread.link.sub}</span>
                </span>
                <span className="dash-eyebrow shrink-0">{thread.link.label}</span>
              </Link>
            </Card>

            <Card pad={16}>
              <CardTitle>Reply templates</CardTitle>
              <div className="flex flex-col gap-[8px]">
                {REPLY_TEMPLATES.map((template) => (
                  <button
                    key={template}
                    type="button"
                    onClick={() => setComposer(template)}
                    className="rounded-tile border border-line-strong bg-tile-grad p-[10px] text-left text-[11px] text-ink-2 transition hover:text-ink-1"
                  >
                    {template}
                  </button>
                ))}
              </div>
            </Card>
          </>
        }
      >
        <div className="flex flex-col gap-[14px] lg:flex-row">
          <Card pad={14} className="w-full shrink-0 lg:w-[310px]">
            <SearchField
              value={query}
              onChange={setQuery}
              label="Search messages"
              placeholder="Search"
              height={32}
            />
            <div className="mt-[10px] flex flex-wrap gap-[6px]">
              {(['all', 'unread', 'supplier'] as Filter[]).map((key) => (
                <Chip
                  key={key}
                  label={key === 'supplier' ? 'Suppliers' : key === 'all' ? 'All' : 'Unread'}
                  active={filter === key}
                  onClick={() => setFilter(filter === key ? 'all' : key)}
                />
              ))}
            </div>

            <div className="mt-[12px] flex flex-col">
              {visible.length === 0 ? (
                <p className="py-6 text-center text-[11.5px] text-ink-4">No threads match.</p>
              ) : (
                visible.map(({ thread: item, index }) => {
                  const unread = unreadOf(index);
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => open(index)}
                      aria-current={index === selected ? 'true' : undefined}
                      className={cn(
                        'flex items-start gap-[10px] rounded-tile p-[10px] text-left transition',
                        index === selected ? 'bg-lime/[0.07]' : 'hover:bg-white/[0.025]',
                      )}
                    >
                      <Avatar name={item.name} size={30} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-[12px] font-bold text-ink-1">
                            {item.name}
                          </span>
                          <span className="shrink-0 text-[9.5px] text-ink-4">{item.time}</span>
                        </span>
                        <span className="mt-[2px] flex items-center gap-[6px]">
                          <span className="min-w-0 flex-1 truncate text-[10.5px] text-ink-4">
                            {item.preview}
                          </span>
                          {unread > 0 && (
                            <span
                              aria-label={`${unread} unread messages`}
                              className="shrink-0 rounded-pill bg-lime/[0.16] px-[6px] py-[1px] text-[9.5px] font-bold text-lime"
                            >
                              {unread > 9 ? '9+' : unread}
                            </span>
                          )}
                        </span>
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </Card>

          <Card pad={0} className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <div className="flex items-center gap-[10px] border-b border-line p-[14px]">
              <Avatar name={thread.name} size={32} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12.5px] font-bold text-ink-1">
                  {thread.name}
                </span>
                <span className="block truncate text-[10.5px] text-ink-4">{thread.role}</span>
              </span>
              <Button
                size="sm"
                disabled={unreadOf(selected) === 0}
                onClick={() =>
                  setRead((current) =>
                    current.includes(selected) ? current : [...current, selected],
                  )
                }
              >
                Mark read
              </Button>
            </div>

            <div className="flex min-h-[280px] flex-1 flex-col gap-[10px] overflow-y-auto p-[14px]">
              <p className="text-center text-[9.5px] font-bold uppercase tracking-[1.2px] text-ink-5">
                Today
              </p>
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn('flex', message.outgoing ? 'justify-end' : 'justify-start')}
                >
                  <div
                    className={cn(
                      'max-w-[78%] px-[12px] py-[9px] text-[12px]',
                      message.outgoing
                        ? 'rounded-[14px_14px_4px_14px] bg-lime-grad font-semibold text-lime-ink shadow-lime-sm'
                        : 'rounded-[14px_14px_14px_4px] border border-line-strong bg-tile-grad text-ink-1',
                    )}
                  >
                    {message.text}
                    <span
                      className={cn(
                        'mt-[4px] block text-[9.5px]',
                        message.outgoing ? 'text-lime-ink/60' : 'text-ink-4',
                      )}
                    >
                      {message.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-end gap-[9px] border-t border-line p-[14px]">
              <button
                type="button"
                aria-label="Attach a file"
                className="inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-chip border border-line-strong bg-tile-grad text-ink-2 transition hover:text-ink-1"
              >
                <Plus size={15} />
              </button>
              <label htmlFor="composer" className="sr-only">
                Write a reply
              </label>
              <textarea
                id="composer"
                rows={1}
                value={composer}
                placeholder="Write a reply"
                onChange={(event) => setComposer(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    send();
                  }
                }}
                className="max-h-[120px] min-h-[34px] flex-1 resize-none rounded-chip border border-line-strong bg-tile-grad px-3 py-[8px] text-[12px] text-ink-1 placeholder:text-ink-5 focus:border-lime focus:outline-none focus:ring-2 focus:ring-lime/20"
              />
              <button
                type="button"
                onClick={send}
                disabled={composer.trim().length === 0}
                aria-label="Send reply"
                className="on-lime inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-chip bg-lime-grad text-lime-ink shadow-lime transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
              >
                <Mail size={15} />
              </button>
            </div>
          </Card>
        </div>
      </PageBody>
    </>
  );
}
