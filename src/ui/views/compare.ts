import { compareCharts, computeChart } from '@engine';
import { CHANNELS, DYNAMICS } from '@content';
import type { BirthInput, Chart, DynamicKind } from '@/types';
import { renderComposite, compositeLegend } from '@ui/composite';
import { closestWith, h, render, setTrustedHtml } from '@ui/dom';
import { createBirthForm } from '@ui/form';
import { buildHash } from '@ui/router';
import {
  centerLabel,
  channelId,
  chip,
  copyText,
  describeBirth,
  section,
  typeClass,
} from './common';
import { detailFor, emptyDetail } from './detail';
import type { ViewContext } from './types';

const DYNAMIC_ORDER: DynamicKind[] = [
  'electromagnetic',
  'companionship',
  'dominance',
  'compromise',
];

function ownerText(kind: DynamicKind, owner: string): string {
  if (kind === 'electromagnetic') return 'Completed only when you are together';
  if (kind === 'companionship') return 'Both of you have it';
  return `Complete in ${owner}'s chart`;
}

function slot(
  ctx: ViewContext,
  label: string,
  prefix: string,
  initial: BirthInput | undefined,
  onChange: (input: BirthInput) => void,
): HTMLElement {
  const ready = h('p', { class: 'status', 'aria-live': 'polite' });
  const accept = (input: BirthInput): void => {
    ready.textContent = `${label} is set: ${input.name || 'unnamed'}, ${input.date}.`;
    onChange(input);
  };
  const form = createBirthForm({
    idPrefix: prefix,
    submitLabel: `Use ${label}`,
    compact: true,
    onSubmit: accept,
  });
  const people = ctx.store.list();
  const select = h(
    'select',
    {
      id: `${prefix}-saved`,
      on: {
        change: (event) => {
          const id = (event.target as HTMLSelectElement).value;
          const person = people.find((p) => p.id === id);
          if (person) {
            form.setValues(person.input);
            accept(person.input);
          }
        },
      },
    },
    h('option', { value: '' }, 'Choose…'),
    people.map((p) =>
      h('option', { value: p.id }, `${p.input.name || 'Unnamed'} (${p.input.date})`),
    ),
  );
  if (initial) {
    form.setValues(initial);
    ready.textContent = `${label} is set: ${initial.name || 'unnamed'}, ${initial.date}.`;
  }
  return h(
    'div',
    { class: 'card slot' },
    h('h3', null, label),
    people.length
      ? h('div', { class: 'field' }, h('label', { for: select.id }, 'Use a saved person'), select)
      : null,
    form.element,
    ready,
  );
}

function miniSummary(chart: Chart, label: string): HTMLElement {
  return h(
    'div',
    { class: `card mini ${typeClass(chart.type)}` },
    h('p', { class: 'eyebrow' }, label),
    h('h3', null, chart.input.name || label),
    h('p', { class: 'muted small' }, describeBirth(chart.input)),
    h('div', { class: 'type-badge small' }, chart.type),
    h(
      'dl',
      { class: 'facts compact' },
      ...[
        ['Authority', chart.authority],
        ['Profile', chart.profile],
        ['Definition', chart.definition],
        ['Defined centers', chart.definedCenters.map(centerLabel).join(', ') || 'None'],
      ].map(([k, v]) => h('div', { class: 'fact' }, h('dt', null, k), h('dd', null, v))),
    ),
  );
}

function renderComparison(a: Chart, b: Chart, ctx: ViewContext): HTMLElement {
  const comparison = compareCharts(a, b);
  const nameA = a.input.name || 'Person A';
  const nameB = b.input.name || 'Person B';
  const status = h('p', { class: 'status', 'aria-live': 'polite' });
  const detail = h('div', { class: 'detail-content', tabindex: -1 }, emptyDetail());

  const figure = h('div', { class: 'figure-stage' });
  setTrustedHtml(figure, renderComposite(a, b, comparison));
  const legend = h('div', { class: 'legend' });
  setTrustedHtml(legend, compositeLegend());

  const channelRows = comparison.channels.map((c) => {
    const id = channelId(c);
    const info = (CHANNELS as Record<string, { name: string; summary: string } | undefined>)[id];
    const dynamic = DYNAMICS[c.kind];
    const owner = c.owner === 'a' ? nameA : c.owner === 'b' ? nameB : 'Both together';
    return h(
      'li',
      { class: `card channel-row dyn-${c.kind}` },
      h(
        'div',
        { class: 'row-head' },
        chip(`channel:${id}`, id),
        h('strong', null, ` ${info?.name ?? ''}`),
        chip(`dynamic:${c.kind}`, dynamic?.title ?? c.kind, 'chip-dyn'),
      ),
      h(
        'p',
        { class: 'small muted' },
        `${ownerText(c.kind, owner)} · ${centerLabel(c.centers[0])} to ${centerLabel(c.centers[1])}`,
      ),
      h('p', { class: 'small' }, info?.summary ?? ''),
      dynamic ? h('p', { class: 'small muted' }, dynamic.summary) : null,
    );
  });

  const share = h(
    'button',
    {
      type: 'button',
      class: 'btn',
      on: {
        click: () => {
          const url = ctx.urlFor(buildHash({ name: 'compare', a: a.input, b: b.input }));
          void copyText(url).then((ok) => {
            status.textContent = ok
              ? 'Link copied. It contains both birth details.'
              : `Copy this link: ${url}`;
          });
        },
      },
    },
    'Share link',
  );
  const print = h(
    'button',
    { type: 'button', class: 'btn', on: { click: () => window.print() } },
    'Print / save as PDF',
  );

  return h(
    'div',
    {
      class: 'result',
      on: {
        click: (event) => {
          const key = closestWith(event.target, '[data-tip]')?.getAttribute('data-tip');
          if (key) render(detail, detailFor(key));
        },
      },
    },
    h(
      'header',
      { class: 'result-head' },
      h(
        'div',
        null,
        h('p', { class: 'eyebrow' }, 'Comparison'),
        h('h2', { id: 'result-title', tabindex: -1 }, `${nameA} and ${nameB}`),
      ),
      h('div', { class: 'actions' }, share, print),
    ),
    status,
    h('div', { class: 'two-col' }, miniSummary(a, 'Person A'), miniSummary(b, 'Person B')),
    h(
      'div',
      { class: 'result-grid' },
      h(
        'div',
        { class: 'stage-card card' },
        h('h2', { class: 'eyebrow' }, 'Composite BodyGraph'),
        figure,
        legend,
      ),
      h(
        'aside',
        { class: 'card detail', 'aria-labelledby': 'detail-title' },
        h('h2', { id: 'detail-title', class: 'eyebrow' }, 'Explanation'),
        h('div', { 'aria-live': 'polite' }, detail),
      ),
    ),
    section(
      'dynamics-title',
      'The four dynamics',
      h(
        'div',
        { class: 'dyn-grid' },
        DYNAMIC_ORDER.map((kind) =>
          h(
            'div',
            { class: `card dyn dyn-${kind}` },
            h('div', { class: 'count' }, String(comparison.counts[kind])),
            h('div', null, chip(`dynamic:${kind}`, DYNAMICS[kind]?.title ?? kind)),
          ),
        ),
      ),
    ),
    section(
      'newly-title',
      'Centers',
      h(
        'div',
        { class: 'card' },
        comparison.newlyDefinedCenters.length === 0
          ? h('p', { class: 'muted' }, 'No center becomes defined only through the combination.')
          : h(
              'p',
              null,
              'Defined only when you are together: ',
              ...comparison.newlyDefinedCenters.flatMap((c) => [
                chip(`center:${c}`, centerLabel(c), 'chip-defined'),
                ' ',
              ]),
            ),
        h(
          'p',
          { class: 'muted small' },
          `Defined together: ${comparison.compositeDefinedCenters.map(centerLabel).join(', ') || 'none'}.`,
        ),
      ),
    ),
    section(
      'compared-title',
      `Compared channels (${comparison.channels.length})`,
      comparison.channels.length === 0
        ? h('p', { class: 'muted' }, 'No channels to compare.')
        : h('ul', { class: 'channel-rows' }, channelRows),
    ),
  );
}

/** The compare view: two people in, composite chart and dynamics out. */
export function compareView(
  ctx: ViewContext,
  a: BirthInput | undefined,
  b: BirthInput | undefined,
): HTMLElement {
  let personA = a;
  let personB = b;
  const host = h('div', { class: 'result-host' });
  const changed = (): void => {
    if (personA && personB) ctx.navigate(buildHash({ name: 'compare', a: personA, b: personB }));
  };
  const root = h(
    'div',
    { class: 'view view-compare' },
    h(
      'header',
      { class: 'page-head' },
      h('p', { class: 'eyebrow' }, 'Relationships'),
      h('h1', null, 'Compare two charts'),
      h(
        'p',
        { class: 'lead' },
        'See how two designs meet: where channels complete each other, where one person leads and where you simply share a colour. All computed on this device.',
      ),
    ),
    h(
      'div',
      { class: 'two-col' },
      slot(ctx, 'Person A', 'hd-a', a, (i) => {
        personA = i;
        changed();
      }),
      slot(ctx, 'Person B', 'hd-b', b, (i) => {
        personB = i;
        changed();
      }),
    ),
    host,
  );
  if (a && b) {
    try {
      render(host, renderComparison(computeChart(a), computeChart(b), ctx));
    } catch (error) {
      render(
        host,
        h(
          'p',
          { class: 'error', role: 'alert' },
          `Could not compare: ${error instanceof Error ? error.message : 'unknown error'}.`,
        ),
      );
    }
  }
  return root;
}
