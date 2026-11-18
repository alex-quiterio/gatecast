/**
 * Pure helpers shared by the build script and the service worker. Nothing here
 * touches the Cache API or the worker globals, so it is unit-testable.
 */

/** Prefix of the versioned app-shell cache. */
export const PRECACHE_PREFIX = 'gatecast-precache-';

/** Unversioned cache for optional runtime data (kept across deploys). */
export const RUNTIME_CACHE = 'gatecast-runtime';

/** Large optional files: runtime-cached, never part of the precache. */
export const RUNTIME_FILES: readonly string[] = ['places.json'];

/** Message the page posts to a waiting worker to activate it. */
export const SKIP_WAITING = 'SKIP_WAITING';

/** How a fetch should be handled. */
export type RouteKind = 'ignore' | 'navigate' | 'runtime' | 'static';

/** Name of the precache for a version string. */
export function precacheName(version: string): string {
  return `${PRECACHE_PREFIX}${version}`;
}

/** True for a path that belongs in the app-shell precache. */
export function isPrecachable(path: string): boolean {
  const clean = path.replace(/^\.?\//, '');
  if (clean === 'sw.js' || clean === '.nojekyll') return false;
  if (clean.endsWith('.map')) return false;
  if (clean.startsWith('screenshots/')) return false;
  if (RUNTIME_FILES.includes(clean)) return false;
  return clean.length > 0;
}

/**
 * Turn emitted file paths into the sorted, de-duplicated list of scope-relative
 * URLs to precache. `index.html` is also reachable as `./`.
 */
export function buildPrecacheList(files: readonly string[]): string[] {
  const urls = new Set<string>();
  for (const file of files) {
    const clean = file.replace(/\\/g, '/').replace(/^\.?\//, '');
    if (!isPrecachable(clean)) continue;
    urls.add(`./${clean}`);
    if (clean === 'index.html') urls.add('./');
  }
  return [...urls].sort();
}

/** Deterministic 53-bit string hash (cyrb53), hex encoded. */
export function hashString(input: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(14, '0');
}

/** Cache version from per-file content hashes; order of entries is irrelevant. */
export function cacheVersion(entries: readonly { path: string; hash: string }[]): string {
  const lines = entries.map((e) => `${e.path}:${e.hash}`).sort();
  return hashString(lines.join('\n'));
}

/** Names of our precaches that are not the current one (to delete on activate). */
export function staleCaches(names: readonly string[], current: string): string[] {
  return names.filter((n) => n.startsWith(PRECACHE_PREFIX) && n !== current);
}

/** Minimal request description the classifier needs. */
export interface RouteInput {
  url: string;
  method: string;
  mode: string;
  /** Absolute URL of the worker scope, e.g. `https://x.github.io/gatecast/`. */
  scope: string;
}

/** Classify a request: same-origin, in-scope GETs only. */
export function classifyRequest(input: RouteInput): RouteKind {
  if (input.method !== 'GET') return 'ignore';
  let url: URL;
  let scope: URL;
  try {
    url = new URL(input.url);
    scope = new URL(input.scope);
  } catch {
    return 'ignore';
  }
  if (url.origin !== scope.origin) return 'ignore';
  if (!url.pathname.startsWith(scope.pathname)) return 'ignore';
  if (input.mode === 'navigate') return 'navigate';
  const rel = url.pathname.slice(scope.pathname.length);
  if (RUNTIME_FILES.includes(rel)) return 'runtime';
  return 'static';
}
