import { useEffect } from 'react';

/**
 * Per-route document metadata.
 *
 * This is a single-page app, so the crawler-visible tags in index.html only
 * describe the landing page. Setting them per route means a shared link to a
 * product page previews as that product.
 *
 * Caveat worth knowing: this runs in the browser. Google executes JavaScript
 * and will see it; most social scrapers (WhatsApp, Slack, iMessage) do not, and
 * will fall back to whatever is in index.html. Proper per-page previews need
 * prerendering or SSR — a later job, and only worth it once there is traffic.
 */

interface SeoProps {
  title: string;
  description: string;
  /** Path-relative canonical, e.g. "/shop". */
  path?: string;
  image?: string;
}

function setMeta(selector: string, attribute: 'name' | 'property', key: string, value: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(selector);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attribute, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', value);
}

export default function Seo({ title, description, path, image }: SeoProps) {
  useEffect(() => {
    const fullTitle = title.includes('Taptile') ? title : `${title} — Taptile`;
    document.title = fullTitle;

    setMeta('meta[name="description"]', 'name', 'description', description);
    setMeta('meta[property="og:title"]', 'property', 'og:title', fullTitle);
    setMeta('meta[property="og:description"]', 'property', 'og:description', description);
    setMeta('meta[property="og:type"]', 'property', 'og:type', 'website');
    setMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', fullTitle);
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);

    const origin = window.location.origin;
    if (image) {
      const absolute = image.startsWith('http') ? image : `${origin}${image}`;
      setMeta('meta[property="og:image"]', 'property', 'og:image', absolute);
      setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', absolute);
    }

    if (path) {
      const url = `${origin}${path}`;
      setMeta('meta[property="og:url"]', 'property', 'og:url', url);

      let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.appendChild(canonical);
      }
      canonical.href = url;
    }
  }, [title, description, path, image]);

  return null;
}
