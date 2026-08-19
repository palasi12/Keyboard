/**
 * Legal document text (privacy policy, terms of service).
 *
 * Static markdown in git, not the Supabase-backed devlog table — these need
 * PR review and a paper trail when they change, not a live editor.
 */

const files = import.meta.glob('../content/legal/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

export function getLegalDoc(name: 'privacy' | 'terms'): string {
  const entry = Object.entries(files).find(([path]) => path.endsWith(`/${name}.md`));
  if (!entry) throw new Error(`Missing legal doc: ${name}`);
  return entry[1];
}
