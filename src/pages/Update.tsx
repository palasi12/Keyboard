import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import { fetchUpdateBySlug, formatUpdateDate, type Update as UpdatePost } from '../lib/updates';
import Seo from '../components/Seo';

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h2 className="mt-10 font-heading text-2xl tracking-heading text-neutral-100 first:mt-0">
      {children}
    </h2>
  ),
  h2: ({ children }) => (
    <h2 className="mt-10 font-heading text-2xl tracking-heading text-neutral-100 first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-8 font-heading text-lg tracking-heading text-neutral-100">{children}</h3>
  ),
  p: ({ children }) => <p className="mt-4 leading-relaxed text-neutral-300">{children}</p>,
  a: ({ href, children }) => (
    <a
      href={href}
      target={href?.startsWith('http') ? '_blank' : undefined}
      rel={href?.startsWith('http') ? 'noreferrer' : undefined}
      className="text-accent underline-offset-2 hover:underline"
    >
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <ul className="mt-4 list-disc space-y-1.5 pl-5 text-neutral-300">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mt-4 list-decimal space-y-1.5 pl-5 text-neutral-300">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  code: ({ children }) => (
    <code className="rounded border border-hairline bg-surface2 px-1.5 py-0.5 text-[13px] text-neutral-200">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="mt-4 overflow-x-auto rounded-lg border border-hairline bg-surface2 p-4 text-[13px] text-neutral-200">
      {children}
    </pre>
  ),
  img: ({ src, alt }) => (
    <img
      src={src}
      alt={alt ?? ''}
      className="mt-4 w-full rounded-lg border border-hairline"
      loading="lazy"
    />
  ),
  blockquote: ({ children }) => (
    <blockquote className="mt-4 border-l-2 border-hairline pl-4 text-neutral-400">
      {children}
    </blockquote>
  ),
};

export default function Update() {
  const { slug } = useParams<{ slug: string }>();
  const [update, setUpdate] = useState<UpdatePost>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void fetchUpdateBySlug(slug).then((result) => {
      if (cancelled) return;
      setUpdate(result.update);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <section className="mx-auto max-w-2xl px-5 py-24 text-center">
        <p className="text-neutral-500" role="status">
          Loading…
        </p>
      </section>
    );
  }

  if (!update) {
    return (
      <section className="mx-auto max-w-2xl px-5 py-24 text-center">
        <Seo title="Update not found" description="That development update does not exist." />
        <h1 className="text-2xl font-heading text-neutral-100">We could not find that update</h1>
        <Link to="/updates" className="btn-primary mt-6">
          Back to updates
        </Link>
      </section>
    );
  }

  return (
    <article className="mx-auto max-w-2xl px-5 py-14">
      <Seo
        title={update.title}
        description={update.excerpt}
        path={`/updates/${update.slug}`}
        image={update.cover}
      />

      <Link to="/updates" className="text-sm text-neutral-500 transition hover:text-neutral-100">
        ← Back to updates
      </Link>

      {update.cover && (
        <img
          src={update.cover}
          alt={`Cover image for "${update.title}"`}
          className="mt-6 aspect-[16/9] w-full rounded-lg border border-hairline object-cover"
        />
      )}

      <h1 className="mt-6 text-3xl font-heading tracking-heading text-neutral-100 sm:text-4xl">
        {update.title}
      </h1>

      {/* Only an admin can ever see this — RLS refuses unpublished rows to
          everyone else — so it doubles as a "you are previewing" marker. */}
      {!update.published && (
        <p className="mt-3 inline-block rounded-full border border-hairline bg-white/[0.04] px-3 py-1 text-xs text-neutral-300">
          Draft — not visible to visitors
        </p>
      )}

      <div className="mt-3 flex items-center gap-2 text-sm text-neutral-500">
        {update.published_at && (
          <>
            <time dateTime={update.published_at}>{formatUpdateDate(update.published_at)}</time>
            <span aria-hidden="true">·</span>
          </>
        )}
        <span>{update.author}</span>
      </div>

      <div className="mt-8">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {update.body}
        </ReactMarkdown>
      </div>

      <div className="mt-12 border-t-2 border-divider pt-8">
        <Link to="/updates" className="btn-secondary">
          Back to updates
        </Link>
      </div>
    </article>
  );
}
