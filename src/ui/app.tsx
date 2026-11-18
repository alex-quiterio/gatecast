import { render } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { BirthInput } from '@/types';
import { CommandPalette } from '@ui/components/command-palette';
import { Icon, type IconName } from '@ui/components/icons';
import { PwaBanner, InstallButton } from '@ui/components/pwa-banner';
import { SavedList } from '@ui/components/saved-list';
import { ShortcutsDialog } from '@ui/components/shortcuts-dialog';
import { ToastProvider } from '@ui/components/toast';
import { TooltipHost } from '@ui/components/tooltip';
import { AppContext, type AppContextValue } from './context';
import { useHashRoute, usePeopleStore, useShortcuts, useTheme } from './hooks';
import { TAB_LABELS } from './library-logic';
import { buildHash, type Route } from './router';
import { buildQuickItems } from './search-logic';
import { encodePerson } from './share';
import { browserStorage } from './storage';
import { AboutView, NotFoundView, REPO_URL } from './views/about';
import { ChartView } from './views/chart';
import { CompareView } from './views/compare';
import { LibraryView } from './views/library';

const NAV: { name: Route['name']; label: string; href: string; icon: IconName }[] = [
  { name: 'chart', label: 'Chart', href: '#/', icon: 'chart' },
  { name: 'compare', label: 'Compare', href: '#/compare', icon: 'compare' },
  { name: 'library', label: 'Library', href: '#/library', icon: 'book' },
  { name: 'about', label: 'About', href: '#/about', icon: 'info' },
];

const TITLES: Record<Route['name'], string> = {
  chart: 'Chart',
  compare: 'Compare',
  library: 'Library',
  about: 'About',
  notFound: 'Not found',
};

/** The breadcrumb trail shown in the app bar. */
export function crumbsFor(route: Route): string[] {
  switch (route.name) {
    case 'chart':
      return route.person ? ['Chart', route.person.name || 'Unnamed'] : ['Chart', 'New'];
    case 'compare':
      return route.a && route.b
        ? ['Compare', `${route.a.name || 'A'} and ${route.b.name || 'B'}`]
        : ['Compare'];
    case 'library':
      return route.id
        ? ['Library', TAB_LABELS[route.tab], route.id]
        : ['Library', TAB_LABELS[route.tab]];
    default:
      return [TITLES[route.name]];
  }
}

/** The whole application: shell, routing, theme, tooltips, quick find and shortcuts. */
export function App() {
  const storage = useMemo(() => browserStorage(), []);
  const [theme, toggleTheme] = useTheme(storage);
  const router = useHashRoute();
  const { route } = router;
  const { store, people, refresh } = usePeopleStore(storage);
  const [palette, setPalette] = useState(false);
  const [help, setHelp] = useState(false);
  const main = useRef<HTMLElement>(null);
  const chord = useRef(0);

  const ctx: AppContextValue = {
    store,
    people,
    refreshPeople: refresh,
    navigate: router.navigate,
    replaceHash: router.replace,
    urlFor: router.urlFor,
    hash: router.hash,
    openSearch: () => setPalette(true),
  };

  // Title and scroll restoration on every navigation.
  useEffect(() => {
    document.title = `${TITLES[route.name]} · Gatecast`;
    const isResult =
      (route.name === 'chart' && route.person) || (route.name === 'compare' && route.a && route.b);
    if (!isResult && !(route.name === 'library' && route.id)) window.scrollTo(0, 0);
  }, [router.nonce]);

  // Ctrl/Cmd+K anywhere, even while typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPalette(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const modal = palette || help;
  const go = (hash: string): void => {
    if (Date.now() - chord.current < 1200) router.navigate(hash);
    chord.current = 0;
  };
  useShortcuts(
    {
      '/': () => setPalette(true),
      '?': () => setHelp(true),
      t: toggleTheme,
      g: () => {
        chord.current = Date.now();
      },
      c: () => go('#/'),
      m: () => go('#/compare'),
      l: () => go('#/library'),
      a: () => go('#/about'),
    },
    !modal,
  );

  const quickItems = useMemo(() => buildQuickItems(people), [people]);
  const crumbs = crumbsFor(route);
  const activePerson: BirthInput | undefined = route.name === 'chart' ? route.person : undefined;
  const activeId = activePerson ? encodePerson(activePerson) : undefined;
  const workspace =
    (route.name === 'chart' && Boolean(route.person)) ||
    (route.name === 'compare' && Boolean(route.a && route.b));

  let view;
  switch (route.name) {
    case 'chart':
      view = <ChartView person={route.person} />;
      break;
    case 'compare':
      view = <CompareView a={route.a} b={route.b} />;
      break;
    case 'library':
      view = <LibraryView tab={route.tab} id={route.id} />;
      break;
    case 'about':
      view = <AboutView />;
      break;
    case 'notFound':
      view = <NotFoundView path={route.path} />;
      break;
  }

  return (
    <AppContext.Provider value={ctx}>
      <ToastProvider>
        <a
          class="skip-link"
          href="#main"
          onClick={(e) => {
            e.preventDefault();
            main.current?.focus();
          }}
        >
          Skip to content
        </a>
        <div class="app" data-workspace={workspace}>
          <header class="appbar">
            <a class="brand" href="#/" aria-label="Gatecast home">
              <img src="./logo.svg" alt="" width="24" height="24" />
              <span>Gatecast</span>
            </a>
            <nav class="crumbs" aria-label="Breadcrumb">
              <ol>
                {crumbs.map((c, i) => (
                  <li key={`${i}-${c}`} aria-current={i === crumbs.length - 1 ? 'page' : undefined}>
                    {c}
                  </li>
                ))}
              </ol>
            </nav>
            <span class="appbar-spacer" />
            <button type="button" class="btn btn-ghost find" onClick={() => setPalette(true)}>
              <Icon name="search" />
              <span class="find-label">Quick find</span>
              <kbd class="find-kbd">Ctrl K</kbd>
            </button>
            <InstallButton />
            <button
              type="button"
              class="btn btn-icon btn-ghost help-btn"
              aria-label="Keyboard shortcuts"
              onClick={() => setHelp(true)}
            >
              <Icon name="keyboard" />
            </button>
            <button
              type="button"
              class="btn btn-icon btn-ghost theme-toggle"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
              onClick={toggleTheme}
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
            </button>
          </header>

          <div class="rail">
            <nav aria-label="Main">
              {NAV.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  aria-current={item.name === route.name ? 'page' : undefined}
                  class="rail-link"
                >
                  <Icon name={item.icon} size={18} />
                  <span>{item.label}</span>
                </a>
              ))}
            </nav>
            <section class="rail-saved" aria-label="Saved charts">
              <h2 class="micro">Saved charts</h2>
              {people.length === 0 ? (
                <p class="empty-hint">Charts you save appear here, on this device only.</p>
              ) : (
                <SavedList
                  people={people}
                  activeId={activeId}
                  loadLabel="Open"
                  detailed={false}
                  onOpen={(input) => router.navigate(buildHash({ name: 'chart', person: input }))}
                  onDelete={(p) => {
                    store.remove(p.id);
                    refresh();
                  }}
                />
              )}
            </section>
            <p class="rail-foot micro">Computed in your browser. Nothing is uploaded.</p>
          </div>

          <main id="main" tabIndex={-1} ref={main} class={workspace ? 'is-workspace' : undefined}>
            <div key={router.nonce} class="route">
              {view}
            </div>
            <footer class="site-footer">
              <p>
                Gatecast computes everything in your browser. Nothing is uploaded. For reflection
                and entertainment, not advice.
              </p>
              <p>
                <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
                  Source on GitHub
                </a>
              </p>
            </footer>
          </main>
        </div>
        {palette ? (
          <CommandPalette
            items={quickItems}
            onGo={router.navigate}
            onClose={() => setPalette(false)}
          />
        ) : null}
        {help ? <ShortcutsDialog onClose={() => setHelp(false)} /> : null}
        <TooltipHost />
        <PwaBanner />
      </ToastProvider>
    </AppContext.Provider>
  );
}

/** Mount the whole app into `root`. */
export function startApp(root: HTMLElement): void {
  render(<App />, root);
}
