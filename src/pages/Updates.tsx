import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchUpdates, formatUpdateDate, type Update } from '../lib/updates';
import Seo from '../components/Seo';

export default function Updates() {
  const [updates, setUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    void fetchUpdates().then((result) => {
      if (cancelled) return;
      setUpdates(result.updates);
      setError(result.error);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="mx-auto max-w-shell px-5 py-14">
      <Seo
        title="Development updates"
        description="Build logs from the Taptile workshop — prototypes, firmware, and progress notes."
        path="/updates"
      />

      <h1 className="text-3xl font-heading tracking-heading text-neutral-100 sm:text-4xl">
        Development updates
      </h1>
      <p className="mt-2 max-w-2xl text-neutral-400">
        Build logs from the Taptile workshop — prototypes, firmware, and progress notes as they
        happen.
      </p>

      {loading && (
        <p className="mt-12 text-neutral-500" role="status">
          Loading updates…
        </p>
      )}

      {!loading && error && <p className="mt-12 text-neutral-400">{error}</p>}

      {!loading && !error && updates.length === 0 && (
        <p className="mt-12 text-neutral-500">
          Nothing posted yet — check back soon for the first update.
        </p>
      )}

      {!loading && updates.length > 0 && (
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {updates.map((update) => (
            <Link
              key={update.slug}
              to={`/updates/${update.slug}`}
              className="card group flex flex-col overflow-hidden"
            >
              {update.cover && (
                <div className="aspect-[16/9] w-full overflow-hidden bg-surface2">
                  <img
                    src={update.cover}
                    alt={`Cover image for "${update.title}"`}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
              )}

              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-center gap-2 text-xs text-neutral-500">
                  {update.published_at && (
                    <>
                      <time dateTime={update.published_at}>
                        {formatUpdateDate(update.published_at)}
                      </time>
                      <span aria-hidden="true">·</span>
                    </>
                  )}
                  <span>{update.author}</span>
                </div>

                <h2 className="mt-2 text-xl font-heading tracking-heading text-neutral-100">
                  {update.title}
                </h2>

                <p className="mt-2 flex-1 text-sm leading-relaxed text-neutral-400">
                  {update.excerpt}
                </p>

                {update.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {update.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-hairline bg-white/[0.02] px-2.5 py-1 text-[11px] text-neutral-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
