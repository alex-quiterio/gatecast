import { h, render } from './dom';
import { parseRoute, type Route } from './router';
import { PeopleStore, browserStorage, readTheme, writeTheme, type Theme } from './storage';
import { installTooltips } from './tooltip';
import { aboutView, notFoundView, REPO_URL } from '@ui/views/about';
import { chartView } from '@ui/views/chart';
import { compareView } from '@ui/views/compare';
import { libraryView } from '@ui/views/library';
import type { ViewContext } from '@ui/views/types';

const NAV: { name: Route['name']; label: string; href: string }[] = [
  { name: 'chart', label: 'Chart', href: '#/' },
  { name: 'compare', label: 'Compare', href: '#/compare' },
  { name: 'library', label: 'Library', href: '#/library' },
  { name: 'about', label: 'About', href: '#/about' },
];

const TITLES: Record<Route['name'], string> = {
  chart: 'Chart',
  compare: 'Compare',
  library: 'Library',
  about: 'About',
  notFound: 'Not found',
};

function systemTheme(): Theme {
  try {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

/** Mount the whole app into `root`: shell, routing, theme and tooltips. */
export function startApp(root: HTMLElement): void {
  const storage = browserStorage();
  const store = new PeopleStore(storage);
  let theme: Theme = readTheme(storage) ?? systemTheme();
  const applyTheme = (): void => {
    document.documentElement.dataset['theme'] = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    meta?.setAttribute('content', theme === 'dark' ? '#0d0d1a' : '#faf6ef');
  };
  applyTheme();

  const main = h('main', { id: 'main', tabindex: -1 });
  const nav = h('nav', { 'aria-label': 'Main' });
  const themeButton = h('button', {
    type: 'button',
    class: 'btn btn-quiet theme-toggle',
    on: {
      click: () => {
        theme = theme === 'dark' ? 'light' : 'dark';
        writeTheme(storage, theme);
        applyTheme();
        label();
      },
    },
  });
  const label = (): void => {
    themeButton.textContent = theme === 'dark' ? 'Dawn' : 'Night';
    themeButton.setAttribute(
      'aria-label',
      `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`,
    );
  };
  label();

  const links = NAV.map((item) => ({ item, a: h('a', { href: item.href }, item.label) }));
  nav.append(...links.map((l) => l.a));

  render(
    root,
    h(
      'a',
      {
        class: 'skip-link',
        href: '#main',
        on: {
          click: (e) => {
            e.preventDefault();
            main.focus();
          },
        },
      },
      'Skip to content',
    ),
    h(
      'header',
      { class: 'site-header' },
      h(
        'a',
        { class: 'brand', href: '#/', 'aria-label': 'Gatecast home' },
        h('img', { src: './logo.svg', alt: '', width: 32, height: 32 }),
        h('span', null, 'Gatecast'),
      ),
      nav,
      themeButton,
    ),
    main,
    h(
      'footer',
      { class: 'site-footer' },
      h(
        'p',
        null,
        'Gatecast computes everything in your browser. Nothing is uploaded. For reflection and entertainment, not advice.',
      ),
      h(
        'p',
        null,
        h(
          'a',
          { href: REPO_URL, target: '_blank', rel: 'noopener noreferrer' },
          'Source on GitHub',
        ),
      ),
    ),
  );

  const ctx: ViewContext = {
    store,
    navigate: (hash) => {
      if (location.hash === hash) draw();
      else location.hash = hash;
    },
    replaceHash: (hash) => {
      history.replaceState(null, '', `${location.pathname}${location.search}${hash}`);
    },
    urlFor: (hash) => `${location.origin}${location.pathname}${hash}`,
  };

  function draw(): void {
    const route = parseRoute(location.hash);
    let view: HTMLElement;
    switch (route.name) {
      case 'chart':
        view = chartView(ctx, route.person);
        break;
      case 'compare':
        view = compareView(ctx, route.a, route.b);
        break;
      case 'library':
        view = libraryView(ctx, route.tab, route.id);
        break;
      case 'about':
        view = aboutView();
        break;
      case 'notFound':
        view = notFoundView(route.path);
        break;
    }
    render(main, view);
    document.title = `${TITLES[route.name]} · Gatecast`;
    for (const { item, a } of links) {
      if (item.name === route.name) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    }
    const isResult =
      (route.name === 'chart' && route.person) || (route.name === 'compare' && route.a && route.b);
    if (!isResult && !(route.name === 'library' && route.id)) window.scrollTo(0, 0);
  }

  installTooltips();
  window.addEventListener('hashchange', draw);
  draw();
}
