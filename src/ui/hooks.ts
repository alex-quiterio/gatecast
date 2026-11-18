import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { LEFT_WIDTH_KEY, parseStoredWidth } from './panel-resize-logic';
import { parseRoute, type Route } from './router';
import {
  PeopleStore,
  browserStorage,
  readTheme,
  writeTheme,
  type SavedPerson,
  type StorageLike,
  type Theme,
} from './storage';

/** Result of {@link useHashRoute}. */
export interface HashRouter {
  route: Route;
  /** The raw hash the route was parsed from. */
  hash: string;
  /** Bumps on every navigation, so views can remount even for an identical hash. */
  nonce: number;
  /** Change the hash (re-renders even when it is unchanged). */
  navigate(hash: string): void;
  /** Replace the hash without adding a history entry or re-rendering. */
  replace(hash: string): void;
  /** Absolute URL for a hash, for share links. */
  urlFor(hash: string): string;
}

/** A tiny hash router: `location.hash` as state, no library. */
export function useHashRoute(): HashRouter {
  const [state, setState] = useState(() => ({ hash: location.hash, nonce: 0 }));
  useEffect(() => {
    const onChange = (): void => setState((s) => ({ hash: location.hash, nonce: s.nonce + 1 }));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  const navigate = useCallback((hash: string) => {
    if (location.hash === hash || (hash === '#/' && location.hash === '')) {
      setState((s) => ({ hash: location.hash, nonce: s.nonce + 1 }));
    } else {
      location.hash = hash;
    }
  }, []);
  const replace = useCallback((hash: string) => {
    history.replaceState(null, '', `${location.pathname}${location.search}${hash}`);
  }, []);
  const urlFor = useCallback((hash: string) => `${location.origin}${location.pathname}${hash}`, []);
  const route = useMemo(() => parseRoute(state.hash), [state.hash]);
  return { route, hash: state.hash, nonce: state.nonce, navigate, replace, urlFor };
}

function systemTheme(): Theme {
  try {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

/** Dark/light theme, persisted to storage and applied to `<html data-theme>`. */
export function useTheme(storage: StorageLike | undefined): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(() => readTheme(storage) ?? systemTheme());
  useEffect(() => {
    document.documentElement.dataset['theme'] = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#0e1014' : '#f7f8fa');
  }, [theme]);
  const toggle = useCallback(() => {
    setTheme((current) => {
      const next: Theme = current === 'dark' ? 'light' : 'dark';
      writeTheme(storage, next);
      return next;
    });
  }, [storage]);
  return [theme, toggle];
}

/** The saved people store plus a re-rendering list; `change` announces store edits. */
export interface PeopleState {
  store: PeopleStore;
  people: SavedPerson[];
  /** Re-read the store (call after add/remove). */
  refresh(): void;
}

/** Shared access to the saved people; all consumers see the same list. */
export function usePeopleStore(storage: StorageLike | undefined = browserStorage()): PeopleState {
  const store = useMemo(() => new PeopleStore(storage), [storage]);
  const [people, setPeople] = useState(() => store.list());
  const refresh = useCallback(() => setPeople(store.list()), [store]);
  return { store, people, refresh };
}

/** Subscribe to a CSS media query. */
export function useMediaQuery(query: string): boolean {
  const get = (): boolean => {
    try {
      return window.matchMedia(query).matches;
    } catch {
      return false;
    }
  };
  const [matches, setMatches] = useState(get);
  useEffect(() => {
    let list: MediaQueryList;
    try {
      list = window.matchMedia(query);
    } catch {
      return;
    }
    const onChange = (): void => setMatches(list.matches);
    onChange();
    list.addEventListener('change', onChange);
    return () => list.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

/** Run `handler` on Escape while `active`. */
export function useEscape(active: boolean, handler: () => void): void {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') ref.current();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [active]);
}

/** Call `handler` for pointer presses outside `ref`'s element while `active`. */
export function useOutsideClick(
  ref: { current: HTMLElement | null },
  active: boolean,
  handler: () => void,
): void {
  const latest = useRef(handler);
  latest.current = handler;
  useEffect(() => {
    if (!active) return;
    const onDown = (e: Event): void => {
      if (ref.current && e.target instanceof Node && !ref.current.contains(e.target)) {
        latest.current();
      }
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [ref, active]);
}

function isEditable(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  );
}

/**
 * Single-key shortcuts (no modifiers), ignored while typing in a field.
 * Keys are `KeyboardEvent.key` values, e.g. `s` or `?`.
 */
export function useShortcuts(map: Record<string, () => void>, active = true): void {
  const latest = useRef(map);
  latest.current = map;
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.ctrlKey || e.metaKey || e.altKey || isEditable(e.target)) return;
      const fn = latest.current[e.key];
      if (fn) {
        e.preventDefault();
        fn();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [active]);
}

/** State of the resizable left panel. */
export interface PanelWidth {
  /** The width the user chose, or `undefined` while the stylesheet default applies. */
  width: number | undefined;
  /** Change the width; pass `save: false` while dragging and `true` on release. */
  setWidth(width: number, save?: boolean): void;
  /** Forget the chosen width and go back to the default. */
  reset(): void;
}

/** The left panel width, remembered between visits. */
export function usePanelWidth(storage: StorageLike | undefined = browserStorage()): PanelWidth {
  const [width, setWidthState] = useState<number | undefined>(() => {
    try {
      return parseStoredWidth(storage?.getItem(LEFT_WIDTH_KEY) ?? null);
    } catch {
      return undefined;
    }
  });
  const setWidth = useCallback(
    (next: number, save = true): void => {
      setWidthState(next);
      if (!save) return;
      try {
        storage?.setItem(LEFT_WIDTH_KEY, String(next));
      } catch {
        // Storage is blocked or full: the width still applies for this visit.
      }
    },
    [storage],
  );
  const reset = useCallback((): void => {
    setWidthState(undefined);
    try {
      storage?.removeItem(LEFT_WIDTH_KEY);
    } catch {
      // Nothing to clean up if storage is unavailable.
    }
  }, [storage]);
  return { width, setWidth, reset };
}
