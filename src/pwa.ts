/**
 * PWA state machine: install prompt, iOS hint, update-ready and offline-ready
 * flags, plus service worker registration. A tiny typed store, no framework.
 *
 * The worker registers only on non-localhost hosts, or on localhost with
 * `?sw=1` in the URL, so `bun run dev` is never served from a stale cache.
 */
import { WARM_CACHE } from '@/sw-logic';

/** Public state the UI renders. */
export interface PwaState {
  /** A native install prompt is stashed and ready. */
  canInstall: boolean;
  /** Show the iOS "Share, Add to Home Screen" hint. */
  showIosHint: boolean;
  /** Show the Mac Safari "File, Add to Dock" hint. */
  showMacHint: boolean;
  /** A new worker is waiting. */
  updateReady: boolean;
  /** The app shell was cached for the first time (shown once). */
  offlineReady: boolean;
}

/** The non-standard install prompt event. */
export interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** Outcome of asking to install. */
export type InstallOutcome = 'accepted' | 'dismissed' | 'unavailable';

/** localStorage key remembering a dismissal. */
export const DISMISS_KEY = 'gatecast.pwa.dismissed';
/** How long a dismissal is remembered. */
export const DISMISS_MS = 30 * 24 * 60 * 60 * 1000;

type Listener = (state: PwaState) => void;

const listeners = new Set<Listener>();
let deferred: InstallPromptEvent | undefined;
let attached = false;
let registered = false;
let reloadRequested = false;
let reloaded = false;
let waitingWorker: { postMessage(message: unknown): void } | undefined;
let state: PwaState = initialState();

function initialState(): PwaState {
  return {
    canInstall: false,
    showIosHint: false,
    showMacHint: false,
    updateReady: false,
    offlineReady: false,
  };
}

function set(patch: Partial<PwaState>): void {
  state = { ...state, ...patch };
  for (const fn of [...listeners]) fn(state);
}

/** Current state snapshot. */
export function getPwaState(): PwaState {
  return state;
}

/** Subscribe to state changes; returns the unsubscribe function. */
export function subscribePwa(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** True when running as an installed app. */
export function isStandalone(): boolean {
  try {
    if (window.matchMedia('(display-mode: standalone)').matches) return true;
    if (window.matchMedia('(display-mode: minimal-ui)').matches) return true;
  } catch {
    // matchMedia unavailable
  }
  return (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

/** True for Safari on iOS/iPadOS (not Chrome/Firefox/Edge for iOS, which lack the Share-sheet install). */
export function isIosSafari(ua: string, platform = '', maxTouchPoints = 0): boolean {
  const iPadOs = platform === 'MacIntel' && maxTouchPoints > 1;
  const ios = /iPad|iPhone|iPod/.test(ua) || iPadOs;
  if (!ios) return false;
  return !/CriOS|FxiOS|EdgiOS|OPiOS|GSA\//.test(ua);
}

/**
 * True for Safari 17+ on macOS, which can add any site to the Dock as an app
 * (File, Add to Dock) but never fires an install prompt. Excludes iPadOS
 * (a Mac with touch) and other browsers on macOS.
 */
export function isMacSafari(ua: string, platform = '', maxTouchPoints = 0): boolean {
  if (!/Macintosh/.test(ua) || maxTouchPoints > 1 || /iPad|iPhone|iPod/.test(ua)) return false;
  if (platform && platform !== 'MacIntel') return false;
  if (/Chrome|Chromium|CriOS|Edg|OPR|Firefox|FxiOS/.test(ua)) return false;
  const version = /Version\/(\d+)[\d.]* .*Safari\//.exec(ua);
  return version !== null && Number(version[1]) >= 17;
}

/** True if the user dismissed an install prompt within the last 30 days. */
export function isDismissed(now = Date.now()): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    const at = raw === null ? NaN : Number(raw);
    return Number.isFinite(at) && now - at < DISMISS_MS;
  } catch {
    return false;
  }
}

function remember(now = Date.now()): void {
  try {
    localStorage.setItem(DISMISS_KEY, String(now));
  } catch {
    // storage blocked: the prompt may show again, which is fine
  }
}

/** Whether the worker should register on this location. */
export function shouldRegister(loc: Pick<Location, 'hostname' | 'search'>): boolean {
  const local = loc.hostname === 'localhost' || loc.hostname === '127.0.0.1';
  return !local || new URLSearchParams(loc.search).get('sw') === '1';
}

function refreshSafariHints(): void {
  const { userAgent, platform, maxTouchPoints } = navigator;
  const eligible = !isStandalone() && !isDismissed();
  const ios = eligible && isIosSafari(userAgent, platform, maxTouchPoints);
  const mac = eligible && isMacSafari(userAgent, platform, maxTouchPoints);
  if (ios !== state.showIosHint || mac !== state.showMacHint) {
    set({ showIosHint: ios, showMacHint: mac });
  }
}

function onBeforeInstall(event: Event): void {
  event.preventDefault();
  deferred = event as InstallPromptEvent;
  if (!isStandalone() && !isDismissed()) set({ canInstall: true });
}

function onInstalled(): void {
  deferred = undefined;
  set({ canInstall: false, showIosHint: false, showMacHint: false });
}

/** Start listening for install events (idempotent; safe to call early). */
export function listenForInstall(): void {
  if (attached) return;
  attached = true;
  window.addEventListener('beforeinstallprompt', onBeforeInstall);
  window.addEventListener('appinstalled', onInstalled);
  refreshSafariHints();
}

/** Show the native install prompt, if one is available. */
export async function promptInstall(): Promise<InstallOutcome> {
  const event = deferred;
  if (!event) return 'unavailable';
  deferred = undefined;
  set({ canInstall: false });
  try {
    await event.prompt();
    const { outcome } = await event.userChoice;
    if (outcome === 'dismissed') remember();
    return outcome;
  } catch {
    return 'dismissed';
  }
}

/** Hide the install banner and remember it for 30 days. */
export function dismissInstall(): void {
  remember();
  set({ canInstall: false, showIosHint: false, showMacHint: false });
}

/** Hide the offline-ready message. */
export function dismissOfflineReady(): void {
  set({ offlineReady: false });
}

/** Hide the update toast for now (it returns on next load). */
export function dismissUpdate(): void {
  set({ updateReady: false });
}

/** Minimal worker surface used by the state machine (eases faking in tests). */
export interface WorkerLike {
  state: string;
  postMessage(message: unknown): void;
  addEventListener(type: 'statechange', fn: () => void): void;
}
/** Minimal registration surface. */
export interface RegistrationLike {
  waiting: WorkerLike | null;
  installing: WorkerLike | null;
  addEventListener(type: 'updatefound', fn: () => void): void;
}
/** Minimal container surface. */
export interface ContainerLike {
  controller: unknown;
  addEventListener(type: 'controllerchange', fn: () => void): void;
}

/**
 * Wire a registration into the store: a waiting worker raises `updateReady`;
 * a first-ever install reaching `activated` raises `offlineReady` once.
 */
export function watchRegistration(reg: RegistrationLike, container: ContainerLike): void {
  const hadController = Boolean(container.controller);
  if (reg.waiting && hadController) {
    waitingWorker = reg.waiting;
    set({ updateReady: true });
  }
  reg.addEventListener('updatefound', () => {
    const worker = reg.installing;
    if (!worker) return;
    worker.addEventListener('statechange', () => {
      if (worker.state === 'installed' && container.controller) {
        waitingWorker = worker;
        set({ updateReady: true });
      } else if (worker.state === 'activated' && !hadController) {
        set({ offlineReady: true });
      }
    });
  });
}

/** Activate the waiting worker; the page reloads once on `controllerchange`. */
export function applyUpdate(): void {
  if (!waitingWorker) return;
  reloadRequested = true;
  waitingWorker.postMessage({ type: 'SKIP_WAITING' });
}

function onControllerChange(): void {
  if (!reloadRequested || reloaded) return;
  reloaded = true;
  window.location.reload();
}

/** Visible for tests: handle a controllerchange as the container would. */
export function handleControllerChange(reload: () => void): boolean {
  if (!reloadRequested || reloaded) return false;
  reloaded = true;
  reload();
  return true;
}

/** Minimal container surface for reaching the active worker. */
export interface ReadyContainerLike {
  ready: Promise<{ active: { postMessage(message: unknown): void } | null }>;
}

/**
 * Ask the active worker to cache any optional offline data still missing
 * (the city list). Cheap when everything is cached already.
 */
export async function warmOfflineCache(container: ReadyContainerLike): Promise<boolean> {
  const reg = await container.ready;
  if (!reg.active) return false;
  reg.active.postMessage({ type: WARM_CACHE });
  return true;
}

/** Minimal `navigator.storage` surface. */
export interface StorageManagerLike {
  persisted?: () => Promise<boolean>;
  persist?: () => Promise<boolean>;
}

/**
 * Ask the browser not to evict the offline cache. Only for the installed app,
 * where browsers grant it without a prompt. Returns whether storage is persistent.
 */
export async function persistStorage(
  storage: StorageManagerLike | undefined,
  standalone: boolean,
): Promise<boolean> {
  if (!standalone || !storage?.persist) return false;
  try {
    if (storage.persisted && (await storage.persisted())) return true;
    return await storage.persist();
  } catch {
    return false;
  }
}

async function register(): Promise<void> {
  if (registered || !('serviceWorker' in navigator)) return;
  registered = true;
  try {
    const container = navigator.serviceWorker;
    container.addEventListener('controllerchange', onControllerChange);
    const reg = await container.register('./sw.js', { scope: './' });
    watchRegistration(reg, container);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') void reg.update().catch(() => undefined);
    });
    const warm = (): void => void warmOfflineCache(container).catch(() => undefined);
    warm();
    window.addEventListener('online', warm);
    void persistStorage(navigator.storage as StorageManagerLike | undefined, isStandalone());
  } catch {
    // Registration is an enhancement; never surface failures.
  }
}

/**
 * Entry point, called once from the root component: listens for install events
 * immediately and registers the worker after `load` (production-like hosts only).
 */
export function registerPwa(): void {
  listenForInstall();
  if (!shouldRegister(window.location)) return;
  if (document.readyState === 'complete') void register();
  else window.addEventListener('load', () => void register(), { once: true });
}

/** Reset all module state (tests only). */
export function resetPwaForTests(): void {
  window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  window.removeEventListener('appinstalled', onInstalled);
  deferred = undefined;
  attached = false;
  registered = false;
  reloadRequested = false;
  reloaded = false;
  waitingWorker = undefined;
  listeners.clear();
  state = initialState();
}
