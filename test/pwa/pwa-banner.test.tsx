import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { InstallButton, PwaBanner } from '@ui/components/pwa-banner';
import { listenForInstall, resetPwaForTests } from '@/pwa';
import * as pwa from '@/pwa';

const noop = (): void => undefined;
let host: HTMLElement;
beforeEach(() => {
  localStorage.clear();
  resetPwaForTests();
  host = document.createElement('div');
  document.body.append(host);
});
afterEach(() => {
  render(null, host);
  host.remove();
  resetPwaForTests();
});

function offer(): void {
  const e = new Event('beforeinstallprompt', { cancelable: true });
  Object.assign(e, {
    prompt: async () => undefined,
    userChoice: Promise.resolve({ outcome: 'accepted' }),
  });
  window.dispatchEvent(e);
}

describe('PwaBanner', () => {
  test('renders an empty polite live region by default', () => {
    act(() => render(<PwaBanner />, host));
    const region = host.querySelector('.pwa-stack');
    expect(region?.getAttribute('aria-live')).toBe('polite');
    expect(host.querySelectorAll('.pwa-toast').length).toBe(0);
  });

  test('shows the install offer and hides it on Not now', () => {
    act(() => render(<PwaBanner />, host));
    act(() => offer());
    const toast = host.querySelector('[data-pwa=install]');
    expect(toast?.getAttribute('role')).toBe('status');
    expect(toast?.textContent).toContain('Install Gatecast');
    const buttons = [...host.querySelectorAll('button')];
    act(() => buttons.find((b) => b.textContent === 'Not now')?.click());
    expect(host.querySelector('[data-pwa=install]')).toBeNull();
    expect(pwa.isDismissed()).toBe(true);
  });

  test('install offer disappears on appinstalled', () => {
    act(() => render(<PwaBanner />, host));
    act(() => offer());
    act(() => void window.dispatchEvent(new Event('appinstalled')));
    expect(host.querySelector('[data-pwa=install]')).toBeNull();
  });

  test('Mac Safari gets an Add to Dock hint that Dismiss hides and remembers', () => {
    const ua = Object.getOwnPropertyDescriptor(navigator, 'userAgent');
    const platform = Object.getOwnPropertyDescriptor(navigator, 'platform');
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Safari/605.1.15',
    });
    Object.defineProperty(navigator, 'platform', { configurable: true, value: 'MacIntel' });
    try {
      act(() => render(<PwaBanner />, host));
      const toast = host.querySelector('[data-pwa=mac]');
      expect(toast?.textContent).toContain('Add to Dock');
      expect(host.querySelector('[data-pwa=ios]')).toBeNull();
      act(() => (toast?.querySelector('button') as HTMLButtonElement).click());
      expect(host.querySelector('[data-pwa=mac]')).toBeNull();
      expect(pwa.isDismissed()).toBe(true);
    } finally {
      if (ua) Object.defineProperty(navigator, 'userAgent', ua);
      else delete (navigator as unknown as Record<string, unknown>).userAgent;
      if (platform) Object.defineProperty(navigator, 'platform', platform);
      else delete (navigator as unknown as Record<string, unknown>).platform;
    }
  });

  test('InstallButton appears only when an offer exists', () => {
    listenForInstall();
    act(() => render(<InstallButton />, host));
    expect(host.querySelector('.pwa-install-btn')).toBeNull();
    act(() => offer());
    expect(host.querySelector('.pwa-install-btn')?.textContent).toContain('Install');
  });

  test('update toast and offline-ready message', () => {
    act(() => render(<PwaBanner />, host));
    const worker = {
      state: 'installing',
      postMessage: noop,
      handlers: [] as (() => void)[],
      addEventListener(_t: 'statechange', fn: () => void) {
        this.handlers.push(fn);
      },
    };
    act(() =>
      pwa.watchRegistration(
        {
          waiting: { ...worker, state: 'installed' },
          installing: null,
          addEventListener: noop,
        },
        { controller: {}, addEventListener: noop },
      ),
    );
    expect(host.querySelector('[data-pwa=update]')?.textContent).toContain(
      'A new version is ready.',
    );
    expect(host.querySelector('[data-pwa=update] .pwa-btn-primary')?.textContent).toBe('Reload');

    let found = (): void => undefined;
    act(() =>
      pwa.watchRegistration(
        {
          waiting: null,
          installing: worker,
          addEventListener: (_t, fn) => void (found = fn),
        },
        { controller: null, addEventListener: noop },
      ),
    );
    found();
    worker.state = 'activated';
    act(() => worker.handlers.forEach((h) => h()));
    expect(host.querySelector('[data-pwa=offline]')?.textContent).toContain('offline');
  });
});
