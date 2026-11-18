import { CENTER_GATES } from '@engine';
import { AUTHORITIES, CENTERS, CHANNELS, GATES, GLOSSARY, PROFILES, TYPES } from '@content';
import { CENTER_NAMES, type CenterName } from '@/types';
import { h, render } from '@ui/dom';
import { buildHash, LIBRARY_TABS, type LibraryTab } from '@ui/router';
import { centerLabel } from './common';
import { detailFor } from './detail';
import { createTabs } from './tabs';
import type { ViewContext } from './types';

interface Entry {
  id: string;
  title: string;
  subtitle: string;
  /** Lower-case haystack for search. */
  haystack: string;
  tip: string;
  center?: CenterName;
}

const TAB_LABELS: Record<LibraryTab, string> = {
  gate: 'Gates',
  channel: 'Channels',
  center: 'Centers',
  type: 'Types',
  authority: 'Authorities',
  profile: 'Profiles',
  glossary: 'Glossary',
};

function centerOfGateNumber(gate: number): CenterName | undefined {
  return CENTER_NAMES.find((c) => CENTER_GATES[c]?.includes(gate));
}

function entriesFor(tab: LibraryTab): Entry[] {
  switch (tab) {
    case 'gate':
      return Object.values(GATES)
        .sort((a, b) => a.number - b.number)
        .map((g) => {
          const center = centerOfGateNumber(g.number);
          return {
            id: String(g.number),
            title: `${g.number}. ${g.name}`,
            subtitle: g.keynote,
            haystack: `${g.number} ${g.name} ${g.keynote} ${g.iching}`.toLowerCase(),
            tip: `gate:${g.number}`,
            ...(center ? { center } : {}),
          };
        });
    case 'channel':
      return Object.entries(CHANNELS)
        .sort(([a], [b]) => Number(a.split('-')[0]) - Number(b.split('-')[0]) || a.localeCompare(b))
        .map(([id, c]) => ({
          id,
          title: `${id} ${c.name}`,
          subtitle: [c.circuit, c.stream].filter(Boolean).join(' · '),
          haystack: `${id} ${c.name} ${c.circuit ?? ''} ${c.stream ?? ''}`.toLowerCase(),
          tip: `channel:${id}`,
        }));
    case 'center':
      return CENTER_NAMES.map((c) => ({
        id: c,
        title: CENTERS[c]?.title ?? centerLabel(c),
        subtitle: CENTERS[c]?.theme ?? '',
        haystack: `${c} ${CENTERS[c]?.title ?? ''} ${CENTERS[c]?.theme ?? ''}`.toLowerCase(),
        tip: `center:${c}`,
      }));
    case 'type':
      return Object.entries(TYPES).map(([id, t]) => ({
        id,
        title: id,
        subtitle: t.tagline,
        haystack: `${id} ${t.tagline} ${t.strategy}`.toLowerCase(),
        tip: `type:${id}`,
      }));
    case 'authority':
      return Object.entries(AUTHORITIES).map(([id, a]) => ({
        id,
        title: a.title,
        subtitle: id,
        haystack: `${id} ${a.title} ${a.summary}`.toLowerCase(),
        tip: `authority:${id}`,
      }));
    case 'profile':
      return Object.entries(PROFILES).map(([id, p]) => ({
        id,
        title: `${id} · ${p.name}`,
        subtitle: '',
        haystack: `${id} ${p.name} ${p.summary}`.toLowerCase(),
        tip: `profile:${id}`,
      }));
    case 'glossary':
      return GLOSSARY.map((g) => ({
        id: g.term,
        title: g.term,
        subtitle: '',
        haystack: `${g.term} ${g.definition}`.toLowerCase(),
        tip: `term:${g.term}`,
      }));
  }
}

/** The library view: searchable reference with deep links (`#/library/gate/20`). */
export function libraryView(
  ctx: ViewContext,
  initialTab: LibraryTab,
  initialId: string | undefined,
): HTMLElement {
  let tab = initialTab;
  let openId = initialId;
  let query = '';
  let centerFilter: CenterName | '' = '';

  const list = h('div', { class: 'lib-list' });
  const count = h('p', { class: 'muted small', 'aria-live': 'polite' });
  const search = h('input', {
    type: 'search',
    id: 'lib-search',
    placeholder: 'Search by number, name or keyword',
    autocomplete: 'off',
    on: {
      input: (event) => {
        query = (event.target as HTMLInputElement).value.trim().toLowerCase();
        draw();
      },
    },
  });
  const centerSelect = h(
    'select',
    {
      id: 'lib-center',
      on: {
        change: (event) => {
          centerFilter = (event.target as HTMLSelectElement).value as CenterName | '';
          draw();
        },
      },
    },
    h('option', { value: '' }, 'All centers'),
    CENTER_NAMES.map((c) => h('option', { value: c }, centerLabel(c))),
  );
  const centerField = h(
    'div',
    { class: 'field' },
    h('label', { for: 'lib-center' }, 'Center'),
    centerSelect,
  );
  const panel = h(
    'div',
    { role: 'tabpanel', id: 'lib-panel', 'aria-labelledby': `lib-tab-${tab}`, tabindex: -1 },
    list,
  );

  function draw(): void {
    centerField.hidden = tab !== 'gate';
    panel.setAttribute('aria-labelledby', `lib-tab-${tab}`);
    const entries = entriesFor(tab).filter(
      (e) =>
        (!query || e.haystack.includes(query)) &&
        (!centerFilter || tab !== 'gate' || e.center === centerFilter),
    );
    count.textContent = `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`;
    render(
      list,
      entries.length === 0 ? h('p', { class: 'muted' }, 'Nothing matches that search.') : null,
      entries.map((entry) => {
        const details = h(
          'details',
          {
            class: 'card lib-item',
            id: `lib-${tab}-${entry.id.replace(/[^\w-]/g, '_')}`,
            open: openId === entry.id,
          },
          h(
            'summary',
            null,
            h('span', { class: 'lib-title' }, entry.title),
            entry.subtitle ? h('span', { class: 'muted small' }, entry.subtitle) : null,
          ),
        );
        const fill = (): void => {
          if (!details.querySelector('.detail-body')) details.appendChild(detailFor(entry.tip));
        };
        if (details.open) fill();
        details.addEventListener('toggle', () => {
          if (details.open) {
            fill();
            openId = entry.id;
            ctx.replaceHash(buildHash({ name: 'library', tab, id: entry.id }));
          }
        });
        return details;
      }),
    );
  }

  const tabs = createTabs(
    'lib',
    'Library sections',
    LIBRARY_TABS.map((id) => ({ id, label: TAB_LABELS[id] })),
    tab,
    (id) => {
      if (id === tab && list.childElementCount > 0) return;
      tab = id as LibraryTab;
      openId = undefined;
      ctx.replaceHash(buildHash({ name: 'library', tab }));
      draw();
    },
  );

  const root = h(
    'div',
    { class: 'view view-library' },
    h(
      'header',
      { class: 'page-head' },
      h('p', { class: 'eyebrow' }, 'Reference'),
      h('h1', null, 'Library'),
      h(
        'p',
        { class: 'lead' },
        'Every gate, channel, center, type and term in one place. Expand an item for the full explanation; each has its own link you can share.',
      ),
    ),
    tabs.element,
    h(
      'div',
      { class: 'lib-tools' },
      h('div', { class: 'field' }, h('label', { for: 'lib-search' }, 'Search'), search),
      centerField,
    ),
    count,
    panel,
  );
  draw();
  if (openId) {
    const target = list.querySelector<HTMLElement>('details[open]');
    queueMicrotask(() => target?.scrollIntoView({ block: 'center' }));
  }
  return root;
}
