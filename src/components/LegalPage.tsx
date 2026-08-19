import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import Seo from './Seo';

const markdownComponents: Components = {
  h2: ({ children }) => (
    <h2 className="mt-10 font-heading text-xl tracking-heading text-neutral-100 first:mt-0">
      {children}
    </h2>
  ),
  p: ({ children }) => <p className="mt-4 leading-relaxed text-neutral-300">{children}</p>,
  strong: ({ children }) => <strong className="text-neutral-100">{children}</strong>,
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
  hr: () => <hr className="rule mt-10" />,
};

interface LegalPageProps {
  title: string;
  description: string;
  path: string;
  body: string;
}

export default function LegalPage({ title, description, path, body }: LegalPageProps) {
  return (
    <article className="mx-auto max-w-2xl px-5 py-14">
      <Seo title={title} description={description} path={path} />

      <h1 className="text-3xl font-heading tracking-heading text-neutral-100 sm:text-4xl">
        {title}
      </h1>

      <div className="mt-8">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {body}
        </ReactMarkdown>
      </div>
    </article>
  );
}
