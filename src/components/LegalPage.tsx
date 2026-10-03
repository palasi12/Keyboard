import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import Seo from './Seo';

const markdownComponents: Components = {
  a: ({ href, children }) => (
    <a
      href={href}
      target={href?.startsWith('http') ? '_blank' : undefined}
      rel={href?.startsWith('http') ? 'noreferrer' : undefined}
    >
      {children}
    </a>
  ),
};

interface LegalPageProps {
  title: string;
  description: string;
  path: string;
  body: string;
}

export default function LegalPage({ title, description, path, body }: LegalPageProps) {
  return (
    <article className="page" style={{ background: 'var(--haze)' }}>
      <Seo title={title} description={description} path={path} />
      <div className="shell article">
        <span className="eyebrow">Legal</span>
        <h1>{title}</h1>
        <div className="prose">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {body}
          </ReactMarkdown>
        </div>
      </div>
    </article>
  );
}
