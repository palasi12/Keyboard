import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchUpdates, formatUpdateDate, type Update } from '../lib/updates';
import Seo from '../components/Seo';
import { Reveal } from '../site/chrome';
import { WaitlistForm } from '../site/Waitlist';

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
    <section className="page" style={{ background: 'var(--haze)' }}>
      <Seo
        title="Development updates"
        description="Build logs from the Taptile workshop — prototypes, firmware, and progress notes."
        path="/updates"
      />
      <div className="shell">
        <div className="page-head">
          <span className="eyebrow">Devlog</span>
          <h1>
            Built in <span className="it">the open.</span>
          </h1>
          <p className="lede">
            Prototypes, firmware and progress notes from the workshop, posted as they happen.
          </p>
        </div>

        {loading && (
          <p className="empty" role="status">
            Loading updates…
          </p>
        )}
        {!loading && error && <p className="empty">{error}</p>}
        {!loading && !error && updates.length === 0 && (
          <p className="empty">Nothing posted yet. The first update lands here soon.</p>
        )}

        {!loading && updates.length > 0 && (
          <div className="posts">
            {updates.map((update, i) => (
              <Reveal key={update.slug} delay={(i % 2) as 0 | 1}>
                <Link to={`/updates/${update.slug}`} className="post" style={{ height: '100%' }}>
                  {update.cover && (
                    <div className="post-cover">
                      <img src={update.cover} alt={`Cover image for "${update.title}"`} loading="lazy" />
                    </div>
                  )}
                  <div className="post-body">
                    <div className="post-meta">
                      {update.published_at && (
                        <>
                          <time dateTime={update.published_at}>{formatUpdateDate(update.published_at)}</time>
                          {' · '}
                        </>
                      )}
                      {update.author}
                    </div>
                    <h2>{update.title}</h2>
                    <p>{update.excerpt}</p>
                    {update.tags.length > 0 && (
                      <div className="tags">
                        {update.tags.map((tag) => (
                          <span key={tag} className="tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        )}

        <div className="glass" style={{ marginTop: 90, padding: 'clamp(24px, 4vw, 44px)', borderRadius: 26 }}>
          <span className="eyebrow">Waitlist</span>
          <h2 style={{ marginTop: 16, fontSize: 'clamp(28px, 3.4vw, 44px)' }}>
            Get the first batch <span className="it">before anyone.</span>
          </h2>
          <div style={{ marginTop: 24, maxWidth: 560 }}>
            <WaitlistForm place="updates" />
          </div>
        </div>
      </div>
    </section>
  );
}
