import { useEffect, useState } from 'preact/hooks';
import {
  applyUpdate,
  dismissInstall,
  dismissOfflineReady,
  dismissUpdate,
  getPwaState,
  promptInstall,
  registerPwa,
  subscribePwa,
} from '@/pwa';
import type { PwaState } from '@/pwa';

/** Subscribe a component to the PWA store. */
function usePwaState(): PwaState {
  const [state, setState] = useState<PwaState>(getPwaState());
  useEffect(() => {
    setState(getPwaState());
    return subscribePwa(setState);
  }, []);
  return state;
}

/**
 * Compact "Install" button for the app bar. Renders nothing unless the browser
 * offered a native install prompt. Does not register anything itself: render
 * `<PwaBanner />` once at the root, which does.
 */
export function InstallButton() {
  const { canInstall } = usePwaState();
  if (!canInstall) return null;
  return (
    <button type="button" class="pwa-install-btn" onClick={() => void promptInstall()}>
      <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
        <path
          d="M8 2v8m0 0L5 7m3 3 3-3M3 13h10"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <span>Install</span>
    </button>
  );
}

/**
 * Notifications for install, iOS add-to-home-screen, update and offline-ready.
 * Render once at the app root; it also registers the service worker.
 */
export function PwaBanner() {
  useEffect(() => {
    registerPwa();
  }, []);
  const { canInstall, showIosHint, updateReady, offlineReady } = usePwaState();

  return (
    <div class="pwa-stack" aria-live="polite">
      {updateReady && (
        <div class="pwa-toast" role="status" data-pwa="update">
          <p class="pwa-text">A new version is ready.</p>
          <div class="pwa-actions">
            <button type="button" class="pwa-btn pwa-btn-primary" onClick={applyUpdate}>
              Reload
            </button>
            <button type="button" class="pwa-btn" onClick={dismissUpdate}>
              Later
            </button>
          </div>
        </div>
      )}
      {canInstall && (
        <div class="pwa-toast" role="status" data-pwa="install">
          <p class="pwa-text">Install Gatecast for offline use.</p>
          <div class="pwa-actions">
            <button
              type="button"
              class="pwa-btn pwa-btn-primary"
              onClick={() => void promptInstall()}
            >
              Install Gatecast
            </button>
            <button type="button" class="pwa-btn" onClick={dismissInstall}>
              Not now
            </button>
          </div>
        </div>
      )}
      {showIosHint && !canInstall && (
        <div class="pwa-toast" role="status" data-pwa="ios">
          <p class="pwa-text">Tap Share, then Add to Home Screen.</p>
          <div class="pwa-actions">
            <button type="button" class="pwa-btn" onClick={dismissInstall}>
              Dismiss
            </button>
          </div>
        </div>
      )}
      {offlineReady && (
        <div class="pwa-toast" role="status" data-pwa="offline">
          <p class="pwa-text">Ready to work offline.</p>
          <div class="pwa-actions">
            <button type="button" class="pwa-btn" onClick={dismissOfflineReady}>
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
