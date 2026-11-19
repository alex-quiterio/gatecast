import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import {
  DISMISS_KEY,
  DISMISS_MS,
  applyUpdate,
  dismissInstall,
  getPwaState,
  handleControllerChange,
  isDismissed,
  isIosSafari,
  isMacSafari,
  listenForInstall,
  persistStorage,
  promptInstall,
  resetPwaForTests,
  shouldRegister,
  warmOfflineCache,
  watchRegistration,
} from '@/pwa';
import { WARM_CACHE } from '@/sw-logic';
import type { ContainerLike, RegistrationLike, WorkerLike } from '@/pwa';

function promptEvent(outcome: 'accepted' | 'dismissed'): Event {
  const e = new Event('beforeinstallprompt', { cancelable: true });
  Object.assign(e, { prompt: async () => undefined, userChoice: Promise.resolve({ outcome }) });
  return e;
}

beforeEach(() => {
  localStorage.clear();
  resetPwaForTests();
  listenForInstall();
});
afterEach(() => resetPwaForTests());

describe('install prompt', () => {
  test('is captured and default prevented', () => {
    const e = promptEvent('accepted');
    window.dispatchEvent(e);
    expect(e.defaultPrevented).toBe(true);
    expect(getPwaState().canInstall).toBe(true);
  });
  test('accepted clears the offer and is not remembered', async () => {
    window.dispatchEvent(promptEvent('accepted'));
    expect(await promptInstall()).toBe('accepted');
    expect(getPwaState().canInstall).toBe(false);
    expect(isDismissed()).toBe(false);
  });
  test('dismissed is remembered for 30 days', async () => {
    window.dispatchEvent(promptEvent('dismissed'));
    expect(await promptInstall()).toBe('dismissed');
    expect(isDismissed()).toBe(true);
    expect(isDismissed(Date.now() + DISMISS_MS - 1000)).toBe(true);
    expect(isDismissed(Date.now() + DISMISS_MS + 1000)).toBe(false);
  });
  test('a remembered dismissal suppresses a new offer', () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    window.dispatchEvent(promptEvent('accepted'));
    expect(getPwaState().canInstall).toBe(false);
  });
  test('dismissInstall hides and remembers', () => {
    window.dispatchEvent(promptEvent('accepted'));
    dismissInstall();
    expect(getPwaState().canInstall).toBe(false);
    expect(isDismissed()).toBe(true);
  });
  test('appinstalled hides the offer', () => {
    window.dispatchEvent(promptEvent('accepted'));
    window.dispatchEvent(new Event('appinstalled'));
    expect(getPwaState().canInstall).toBe(false);
  });
  test('without a prompt there is nothing to install', async () => {
    expect(await promptInstall()).toBe('unavailable');
  });
});

describe('detection', () => {
  const safari =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
  test('iOS Safari yes; iOS Chrome, Android, desktop no', () => {
    expect(isIosSafari(safari)).toBe(true);
    expect(isIosSafari(safari.replace('Version/17.0', 'CriOS/120.0'))).toBe(false);
    expect(isIosSafari('Mozilla/5.0 (Linux; Android 14) Chrome/120 Mobile Safari/537.36')).toBe(
      false,
    );
    expect(
      isIosSafari('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605', 'MacIntel', 0),
    ).toBe(false);
  });
  test('iPadOS reports as a Mac with touch', () => {
    expect(
      isIosSafari('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605', 'MacIntel', 5),
    ).toBe(true);
  });
  test('Mac Safari 17+ yes; older Safari, Chrome, Firefox, Edge and iPadOS no', () => {
    const mac = (v: string) =>
      `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${v} Safari/605.1.15`;
    expect(isMacSafari(mac('17.0'), 'MacIntel', 0)).toBe(true);
    expect(isMacSafari(mac('26.1'), 'MacIntel', 0)).toBe(true);
    expect(isMacSafari(mac('16.6'), 'MacIntel', 0)).toBe(false);
    expect(isMacSafari(mac('17.0'), 'MacIntel', 5)).toBe(false);
    expect(isMacSafari(mac('17.0'), 'iPhone', 0)).toBe(false);
    expect(isMacSafari(safari)).toBe(false);
    const chrome =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
    expect(isMacSafari(chrome, 'MacIntel', 0)).toBe(false);
    expect(isMacSafari(`${chrome} Edg/131.0.0.0`, 'MacIntel', 0)).toBe(false);
    expect(
      isMacSafari(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 14.0; rv:132.0) Gecko/20100101 Firefox/132.0',
        'MacIntel',
        0,
      ),
    ).toBe(false);
  });
  test('registration gating', () => {
    expect(shouldRegister({ hostname: 'x.github.io', search: '' })).toBe(true);
    expect(shouldRegister({ hostname: 'localhost', search: '' })).toBe(false);
    expect(shouldRegister({ hostname: 'localhost', search: '?sw=1' })).toBe(true);
  });
});

function fakeWorker(state: string): WorkerLike & { sent: unknown[]; fire(): void } {
  const handlers: (() => void)[] = [];
  const sent: unknown[] = [];
  return {
    state,
    sent,
    postMessage: (m) => void sent.push(m),
    addEventListener: (_t, fn) => void handlers.push(fn),
    fire: () => handlers.forEach((h) => h()),
  };
}
function fakeReg(init: Partial<RegistrationLike> = {}) {
  const handlers: (() => void)[] = [];
  const reg: RegistrationLike & { found(): void } = {
    waiting: null,
    installing: null,
    ...init,
    addEventListener: (_t, fn) => void handlers.push(fn),
    found: () => handlers.forEach((h) => h()),
  };
  return reg;
}
const container = (controller: unknown): ContainerLike => ({
  controller,
  addEventListener: () => undefined,
});

describe('update and offline flow', () => {
  test('a waiting worker with a controller means update ready', () => {
    watchRegistration(fakeReg({ waiting: fakeWorker('installed') }), container({}));
    expect(getPwaState().updateReady).toBe(true);
  });
  test('a waiting worker without a controller is not an update', () => {
    watchRegistration(fakeReg({ waiting: fakeWorker('installed') }), container(null));
    expect(getPwaState().updateReady).toBe(false);
  });
  test('a new worker installing under a controller raises updateReady; apply posts SKIP_WAITING and reloads once', () => {
    const reg = fakeReg();
    const worker = fakeWorker('installing');
    watchRegistration(reg, container({}));
    reg.installing = worker;
    reg.found();
    worker.state = 'installed';
    worker.fire();
    expect(getPwaState().updateReady).toBe(true);
    let reloads = 0;
    expect(handleControllerChange(() => reloads++)).toBe(false);
    applyUpdate();
    expect(worker.sent).toEqual([{ type: 'SKIP_WAITING' }]);
    expect(handleControllerChange(() => reloads++)).toBe(true);
    expect(handleControllerChange(() => reloads++)).toBe(false);
    expect(reloads).toBe(1);
  });
  test('first install reaching activated raises offlineReady', () => {
    const reg = fakeReg();
    const worker = fakeWorker('installing');
    watchRegistration(reg, container(null));
    reg.installing = worker;
    reg.found();
    worker.state = 'activated';
    worker.fire();
    expect(getPwaState().offlineReady).toBe(true);
    expect(getPwaState().updateReady).toBe(false);
  });
});

describe('offline data', () => {
  test('warmOfflineCache posts WARM_CACHE to the active worker', async () => {
    const sent: unknown[] = [];
    const ok = await warmOfflineCache({
      ready: Promise.resolve({ active: { postMessage: (m: unknown) => sent.push(m) } }),
    });
    expect(ok).toBe(true);
    expect(sent).toEqual([{ type: WARM_CACHE }]);
  });
  test('warmOfflineCache does nothing without an active worker', async () => {
    expect(await warmOfflineCache({ ready: Promise.resolve({ active: null }) })).toBe(false);
  });
  test('persistStorage asks only for the installed app', async () => {
    let asked = 0;
    const storage = {
      persisted: async () => false,
      persist: async () => {
        asked++;
        return true;
      },
    };
    expect(await persistStorage(storage, false)).toBe(false);
    expect(asked).toBe(0);
    expect(await persistStorage(storage, true)).toBe(true);
    expect(asked).toBe(1);
  });
  test('persistStorage skips the request when already persistent, and survives errors', async () => {
    let asked = 0;
    const persist = async () => {
      asked++;
      return true;
    };
    expect(await persistStorage({ persisted: async () => true, persist }, true)).toBe(true);
    expect(asked).toBe(0);
    const broken = { persist: async (): Promise<boolean> => Promise.reject(new Error('no')) };
    expect(await persistStorage(broken, true)).toBe(false);
    expect(await persistStorage(undefined, true)).toBe(false);
  });
});
