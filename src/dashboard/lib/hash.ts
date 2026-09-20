/**
 * Stable hash of a name, so a person keeps the same avatar colour on every
 * page. A random pick would reshuffle on each render and make the same human
 * look like two different people between Orders and Messages.
 */
export function hashIndex(value: string, buckets: number): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % buckets;
}

/** "Jenil Thakor" -> "JT". Falls back to "?" so Avatar always has something. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}
