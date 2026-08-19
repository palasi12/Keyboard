import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Seo from '../components/Seo';
import { useAuth } from '../lib/auth';
import {
  checkIsAdmin,
  fetchWaitlist,
  removeFromWaitlist,
  toCsv,
  type WaitlistEntry,
} from '../lib/admin';

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export default function Admin() {
  const { user } = useAuth();

  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const isAdmin = await checkIsAdmin();
    setAllowed(isAdmin);

    if (!isAdmin) {
      setLoading(false);
      return;
    }

    const result = await fetchWaitlist();
    setEntries(result.entries);
    setError(result.error ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return entries;
    return entries.filter((entry) => entry.email.toLowerCase().includes(needle));
  }, [entries, query]);

  function downloadCsv() {
    const blob = new Blob([toCsv(filtered)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `taptile-waitlist-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleRemove(entry: WaitlistEntry) {
    if (!window.confirm(`Remove ${entry.email} from the waitlist?`)) return;
    const ok = await removeFromWaitlist(entry.id);
    if (ok) {
      setEntries((current) => current.filter((item) => item.id !== entry.id));
    } else {
      setError('Could not remove that entry.');
    }
  }

  if (loading && allowed === null) {
    return (
      <section className="mx-auto max-w-shell px-5 py-24 text-center">
        <p className="text-sm text-neutral-500">Checking access…</p>
      </section>
    );
  }

  if (!allowed) {
    return (
      <section className="mx-auto max-w-xl px-5 py-24 text-center">
        <Seo title="Admin" description="Taptile admin." />
        <h1 className="text-2xl font-heading tracking-heading text-neutral-100">
          Not your page
        </h1>
        <p className="mt-3 text-neutral-400">
          {user
            ? `${user.email} is not an admin on this site.`
            : 'Sign in with an admin account to see this.'}
        </p>
        <Link to="/" className="btn-secondary mt-7">
          Back to the site
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-shell px-5 py-14">
      <Seo title="Waitlist — admin" description="Taptile admin." />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker-accent">Admin</p>
          <h1 className="mt-3 text-3xl font-heading tracking-heading text-neutral-100">
            Waitlist
          </h1>
          <p className="mt-2 text-sm text-neutral-400">
            {entries.length} {entries.length === 1 ? 'signup' : 'signups'}
            {query && ` · ${filtered.length} matching`}
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link to="/admin/updates" className="btn-secondary py-2">
            Manage updates
          </Link>
          <button type="button" onClick={() => void load()} className="btn-secondary py-2">
            Refresh
          </button>
          <button
            type="button"
            onClick={downloadCsv}
            className="btn-primary py-2"
            disabled={filtered.length === 0}
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="mt-8">
        <label htmlFor="waitlist-search" className="sr-only">
          Search signups
        </label>
        <input
          id="waitlist-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by email"
          className="field max-w-sm"
        />
      </div>

      {error && (
        <p className="mt-6 text-sm text-accent-400" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="mt-10 text-sm text-neutral-500">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="mt-10 rounded-xl border border-hairline bg-surface px-6 py-12 text-center">
          <p className="text-neutral-400">
            {entries.length === 0 ? 'No signups yet.' : 'Nothing matches that search.'}
          </p>
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-xl border border-hairline">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-hairline bg-surface">
                <th scope="col" className="px-4 py-3 font-medium text-neutral-400">
                  Email
                </th>
                <th scope="col" className="px-4 py-3 font-medium text-neutral-400">
                  Source
                </th>
                <th scope="col" className="px-4 py-3 font-medium text-neutral-400">
                  Signed up
                </th>
                <th scope="col" className="px-4 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => (
                <tr key={entry.id} className="border-b border-hairline last:border-0">
                  <td className="px-4 py-3 text-neutral-100">{entry.email}</td>
                  <td className="px-4 py-3 text-neutral-500">{entry.source}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-neutral-500">
                    {formatDate(entry.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => void handleRemove(entry)}
                      className="text-xs text-neutral-500 transition hover:text-accent-400"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-8 text-xs text-neutral-600">
        Only accounts on the admin allowlist can load this data. The list is enforced in the
        database, not in this page — editing the page in your browser will not reveal anything.
      </p>
    </section>
  );
}
