/**
 * Gatecast service worker. Built by scripts/build.ts as its own entry
 * (`dist/sw.js`), with `__GC_PRECACHE__` and `__GC_VERSION__` injected.
 *
 * The DOM lib is on in tsconfig, so the worker types are declared locally
 * instead of pulling in the webworker lib.
 */
import {
  RUNTIME_CACHE,
  RUNTIME_FILES,
  SKIP_WAITING,
  classifyRequest,
  precacheName,
  staleCaches,
} from '@/sw-logic';

declare const __GC_PRECACHE__: string[];
declare const __GC_VERSION__: string;

interface WorkerEvent extends Event {
  waitUntil(promise: Promise<unknown>): void;
}
interface FetchWorkerEvent extends WorkerEvent {
  request: Request;
  respondWith(response: Promise<Response> | Response): void;
}
interface MessageWorkerEvent extends WorkerEvent {
  data: unknown;
}
interface WorkerScope {
  registration: { scope: string };
  clients: { claim(): Promise<void> };
  skipWaiting(): Promise<void>;
  addEventListener(type: 'install' | 'activate', fn: (e: WorkerEvent) => void): void;
  addEventListener(type: 'fetch', fn: (e: FetchWorkerEvent) => void): void;
  addEventListener(type: 'message', fn: (e: MessageWorkerEvent) => void): void;
}

const sw = self as unknown as WorkerScope;
const CACHE = precacheName(__GC_VERSION__);
const scopeUrl = (): string => sw.registration.scope;

async function precache(): Promise<void> {
  const cache = await caches.open(CACHE);
  // `reload` bypasses the HTTP cache so a deploy never precaches stale files.
  await cache.addAll(__GC_PRECACHE__.map((u) => new Request(u, { cache: 'reload' })));
}

async function prefetchOptional(): Promise<void> {
  const cache = await caches.open(RUNTIME_CACHE);
  for (const file of RUNTIME_FILES) {
    try {
      if (await cache.match(`./${file}`)) continue;
      const res = await fetch(`./${file}`);
      if (res.ok) await cache.put(`./${file}`, res);
    } catch {
      // Optional data: ignore failures, it is cached on first use instead.
    }
  }
}

async function navigate(request: Request): Promise<Response> {
  try {
    return await fetch(request);
  } catch {
    const cache = await caches.open(CACHE);
    const hit =
      (await cache.match(request, { ignoreSearch: true })) ??
      (await cache.match('./index.html')) ??
      (await cache.match('./404.html'));
    return hit ?? Response.error();
  }
}

async function staticAsset(request: Request): Promise<Response> {
  const hit = await caches.match(request, { ignoreSearch: true });
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok && res.type === 'basic') {
    const cache = await caches.open(RUNTIME_CACHE);
    await cache.put(request, res.clone());
  }
  return res;
}

async function staleWhileRevalidate(request: Request): Promise<Response> {
  const cache = await caches.open(RUNTIME_CACHE);
  const hit = await cache.match(request);
  const network = fetch(request)
    .then(async (res) => {
      if (res.ok) await cache.put(request, res.clone());
      return res;
    })
    .catch(() => undefined);
  if (hit) return hit;
  return (await network) ?? Response.error();
}

sw.addEventListener('install', (event) => {
  // No skipWaiting: a new worker waits until the page asks for it.
  event.waitUntil(precache());
});

sw.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(staleCaches(names, CACHE).map((n) => caches.delete(n)));
      await sw.clients.claim();
    })(),
  );
  // Background, not awaited: activation must not wait for ~1 MB of optional data.
  void prefetchOptional();
});

sw.addEventListener('fetch', (event) => {
  const { request } = event;
  const kind = classifyRequest({
    url: request.url,
    method: request.method,
    mode: request.mode,
    scope: scopeUrl(),
  });
  if (kind === 'ignore') return;
  if (kind === 'navigate') event.respondWith(navigate(request));
  else if (kind === 'runtime') event.respondWith(staleWhileRevalidate(request));
  else event.respondWith(staticAsset(request));
});

sw.addEventListener('message', (event) => {
  const data = event.data as { type?: unknown } | null;
  if (data && data.type === SKIP_WAITING) void sw.skipWaiting();
});
