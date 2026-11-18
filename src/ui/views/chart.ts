import { computeChart } from '@engine';
import { AUTHORITIES, CENTERS, CHANNELS, GATES, PLANETS, PROFILES, TYPES } from '@content';
import type { Activation, BirthInput, Chart } from '@/types';
import { renderBodygraph } from '@ui/bodygraph';
import { renderWheel } from '@ui/wheel';
import { closestWith, h, render, setTrustedHtml } from '@ui/dom';
import { createBirthForm } from '@ui/form';
import { buildHash } from '@ui/router';
import {
  activationLabel,
  centerLabel,
  channelId,
  chip,
  copyText,
  describeBirth,
  downloadText,
  infoButton,
  section,
  typeClass,
} from './common';
import { detailFor, emptyDetail } from './detail';
import { createSavedList } from './saved';
import { createTabs } from './tabs';
import type { ViewContext } from './types';

function hero(): HTMLElement {
  return h(
    'section',
    { class: 'hero', 'aria-labelledby': 'hero-title' },
    h(
      'div',
      { class: 'hero-mark', 'aria-hidden': 'true' },
      h('img', { src: './logo.svg', alt: '', width: 128, height: 128 }),
    ),
    h('p', { class: 'eyebrow' }, 'Human Design, privately'),
    h('h1', { id: 'hero-title' }, 'Cast your Human Design chart.'),
    h('p', { class: 'hero-sub' }, 'In your browser. Nothing leaves it.'),
    h(
      'a',
      {
        class: 'btn btn-primary btn-glow',
        href: '#birth-form-card',
        on: {
          click: (e) => {
            e.preventDefault();
            document.getElementById('hd-chart-name')?.focus();
            document.getElementById('birth-form-card')?.scrollIntoView({ behavior: 'smooth' });
          },
        },
      },
      'Cast my chart',
    ),
  );
}

function summaryCard(label: string, tip: string, ...value: Parameters<typeof h>[2][]): HTMLElement {
  return h(
    'div',
    { class: 'card summary-card' },
    h(
      'div',
      { class: 'card-head' },
      h('span', { class: 'eyebrow' }, label),
      infoButton(tip, label),
    ),
    h('div', { class: 'card-value' }, ...value),
  );
}

function summary(chart: Chart): HTMLElement {
  const cross = chart.crossGates;
  const gates = (a: number, b: number): HTMLElement[] => [
    chip(`gate:${a}`, String(a)),
    h('span', { class: 'sep', 'aria-hidden': 'true' }, '/'),
    chip(`gate:${b}`, String(b)),
  ];
  const cards = [
    h(
      'div',
      { class: `card summary-card type-card ${typeClass(chart.type)}` },
      h(
        'div',
        { class: 'card-head' },
        h('span', { class: 'eyebrow' }, 'Type'),
        infoButton(`type:${chart.type}`, chart.type),
      ),
      h('div', { class: 'type-badge' }, chart.type),
      h('p', { class: 'muted' }, TYPES[chart.type]?.tagline ?? ''),
    ),
    summaryCard('Strategy', 'term:Strategy', chart.strategy),
    summaryCard(
      'Authority',
      `authority:${chart.authority}`,
      AUTHORITIES[chart.authority]?.title ?? chart.authority,
    ),
    summaryCard(
      'Profile',
      `profile:${chart.profile}`,
      chart.profile,
      h('span', { class: 'muted card-sub' }, PROFILES[chart.profile]?.name ?? ''),
    ),
    summaryCard('Definition', `definition:${chart.definition}`, chart.definition),
    summaryCard('Not-Self theme', 'term:Not-Self Theme', chart.notSelfTheme),
    summaryCard(
      'Incarnation Cross',
      'term:Incarnation Cross',
      h(
        'span',
        { class: 'cross' },
        ...gates(cross.personalitySun, cross.personalityEarth),
        h('span', { class: 'sep' }, ' | '),
        ...gates(cross.designSun, cross.designEarth),
      ),
    ),
  ];
  cards.forEach((card, i) => card.style.setProperty('--i', String(i)));
  return h('div', { class: 'summary-grid' }, ...cards);
}

function activationTable(title: string, rows: Activation[], hint: string): HTMLElement {
  return h(
    'div',
    { class: 'table-wrap' },
    h(
      'table',
      { class: 'data' },
      h('caption', null, title, h('span', { class: 'muted small' }, ` ${hint}`)),
      h(
        'thead',
        null,
        h(
          'tr',
          null,
          ['Planet', 'Gate.Line.Color.Tone', 'Center', 'Gate name'].map((t) =>
            h('th', { scope: 'col' }, t),
          ),
        ),
      ),
      h(
        'tbody',
        null,
        rows.map((a) =>
          h(
            'tr',
            null,
            h(
              'th',
              { scope: 'row' },
              chip(
                `planet:${a.planet}`,
                `${PLANETS[a.planet]?.glyph ?? ''} ${PLANETS[a.planet]?.label ?? a.planet}`,
              ),
            ),
            h('td', null, chip(`gate:${a.gate}`, activationLabel(a))),
            h('td', null, chip(`center:${a.center}`, centerLabel(a.center))),
            h('td', null, GATES[a.gate]?.name ?? ''),
          ),
        ),
      ),
    ),
  );
}

function centersBlock(chart: Chart): HTMLElement {
  const list = (names: Chart['definedCenters'], open: boolean): HTMLElement =>
    h(
      'ul',
      { class: 'plain-list' },
      names.length === 0 ? h('li', { class: 'muted' }, 'None') : null,
      names.map((c) =>
        h(
          'li',
          null,
          chip(`center:${c}`, centerLabel(c), open ? 'chip-open' : 'chip-defined'),
          h('span', { class: 'muted' }, ` ${CENTERS[c]?.theme ?? ''}`),
          h('p', { class: 'small' }, (open ? CENTERS[c]?.open : CENTERS[c]?.defined) ?? ''),
        ),
      ),
    );
  return section(
    'centers-title',
    'Centers',
    h(
      'div',
      { class: 'two-col' },
      h(
        'div',
        { class: 'card' },
        h('h3', null, `Defined (${chart.definedCenters.length})`),
        list(chart.definedCenters, false),
      ),
      h(
        'div',
        { class: 'card' },
        h('h3', null, `Open (${chart.openCenters.length})`),
        list(chart.openCenters, true),
      ),
    ),
  );
}

function channelsBlock(chart: Chart): HTMLElement {
  return section(
    'channels-title',
    'Channels and gates',
    h(
      'div',
      { class: 'two-col' },
      h(
        'div',
        { class: 'card' },
        h('h3', null, `Channels (${chart.channels.length})`),
        chart.channels.length === 0
          ? h(
              'p',
              { class: 'muted' },
              'No complete channels: every center is open or reached only through hanging gates.',
            )
          : h(
              'ul',
              { class: 'plain-list' },
              chart.channels.map((c) => {
                const id = channelId(c);
                const info = (
                  CHANNELS as Record<string, { name: string; circuit?: string } | undefined>
                )[id];
                return h(
                  'li',
                  null,
                  chip(`channel:${id}`, id),
                  h('strong', null, ` ${info?.name ?? ''}`),
                  info?.circuit ? h('span', { class: 'muted' }, ` · ${info.circuit}`) : null,
                  h(
                    'span',
                    { class: 'muted small block-line' },
                    `${centerLabel(c.centers[0])} to ${centerLabel(c.centers[1])}`,
                  ),
                );
              }),
            ),
      ),
      h(
        'div',
        { class: 'card' },
        h('h3', null, `Hanging gates (${chart.hangingGates.length})`),
        h(
          'p',
          { class: 'muted small' },
          'Gates active in your chart whose channel partner is not.',
        ),
        chart.hangingGates.length === 0
          ? h('p', { class: 'muted' }, 'None.')
          : h(
              'ul',
              { class: 'plain-list' },
              chart.hangingGates.map((g) =>
                h(
                  'li',
                  null,
                  chip(`gate:${g}`, String(g)),
                  h('span', null, ` ${GATES[g]?.name ?? ''}`),
                ),
              ),
            ),
      ),
    ),
  );
}

function renderResult(chart: Chart, ctx: ViewContext, onSaved: () => void): HTMLElement {
  const status = h('p', { class: 'status', 'aria-live': 'polite' });
  const say = (text: string): void => {
    status.textContent = text;
  };
  const input = chart.input;
  const detail = h('div', { class: 'detail-content', tabindex: -1 }, emptyDetail());
  const select = (key: string): void => {
    render(detail, detailFor(key, chart));
  };

  // BodyGraph / Wheel
  const figure = h('div', { class: 'figure-stage' });
  const wheelFigure = h('div', { class: 'figure-stage' });
  let showNumbers = true;
  const drawBody = (): void =>
    setTrustedHtml(
      figure,
      renderBodygraph(chart, { showGateNumbers: showNumbers, idPrefix: 'main' }),
    );
  drawBody();
  setTrustedHtml(wheelFigure, renderWheel(chart));
  wheelFigure.hidden = true;
  const numbers = h('input', {
    type: 'checkbox',
    id: 'toggle-numbers',
    checked: true,
    on: {
      change: (e) => {
        showNumbers = (e.target as HTMLInputElement).checked;
        drawBody();
      },
    },
  });
  const tabs = createTabs(
    'fig',
    'Chart display',
    [
      { id: 'body', label: 'BodyGraph' },
      { id: 'wheel', label: 'Gate wheel' },
    ],
    'body',
    (id) => {
      figure.hidden = id !== 'body';
      wheelFigure.hidden = id !== 'wheel';
      numbersLabel.hidden = id !== 'body';
    },
  );
  const numbersLabel = h(
    'label',
    { class: 'inline-check', for: 'toggle-numbers' },
    numbers,
    ' Gate numbers',
  );
  figure.setAttribute('role', 'tabpanel');
  figure.id = 'fig-panel-body';
  figure.setAttribute('aria-labelledby', 'fig-tab-body');
  wheelFigure.setAttribute('role', 'tabpanel');
  wheelFigure.id = 'fig-panel-wheel';
  wheelFigure.setAttribute('aria-labelledby', 'fig-tab-wheel');

  const saveButton = h(
    'button',
    {
      type: 'button',
      class: 'btn',
      on: {
        click: () => {
          const result = ctx.store.add(input);
          say(result.ok ? `Saved ${input.name || 'this chart'} on this device.` : result.reason);
          if (result.ok) onSaved();
        },
      },
    },
    'Save',
  );
  const shareButton = h(
    'button',
    {
      type: 'button',
      class: 'btn',
      on: {
        click: () => {
          const url = ctx.urlFor(buildHash({ name: 'chart', person: input }));
          void copyText(url).then((ok) =>
            say(
              ok
                ? 'Link copied. It contains the birth details you entered.'
                : `Copy this link: ${url}`,
            ),
          );
        },
      },
    },
    'Share link',
  );
  const jsonButton = h(
    'button',
    {
      type: 'button',
      class: 'btn',
      on: {
        click: () => {
          downloadText(
            `chart-${input.name ? input.name.replace(/[^\p{L}\p{N}]+/gu, '-') : input.date}.json`,
            JSON.stringify(chart, null, 2),
            'application/json',
          );
          say('Chart downloaded as JSON.');
        },
      },
    },
    'Download JSON',
  );
  const printButton = h(
    'button',
    { type: 'button', class: 'btn', on: { click: () => window.print() } },
    'Print / save as PDF',
  );

  const root = h(
    'div',
    {
      class: 'result',
      on: {
        click: (event) => {
          const target = closestWith(event.target, '[data-tip]');
          const key = target?.getAttribute('data-tip');
          if (key) select(key);
        },
        keydown: (event) => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          const target = closestWith(event.target, 'svg [data-tip]');
          const key = target?.getAttribute('data-tip');
          if (key) {
            event.preventDefault();
            select(key);
          }
        },
      },
    },
    h(
      'header',
      { class: 'result-head' },
      h(
        'div',
        null,
        h('p', { class: 'eyebrow' }, 'Your chart'),
        h('h2', { id: 'result-title', tabindex: -1 }, input.name || 'Your chart'),
        h('p', { class: 'muted' }, describeBirth(input)),
      ),
      h('div', { class: 'actions' }, saveButton, shareButton, jsonButton, printButton),
    ),
    status,
    summary(chart),
    h(
      'div',
      { class: 'result-grid' },
      h(
        'div',
        { class: 'stage-card card' },
        h('div', { class: 'stage-bar' }, tabs.element, numbersLabel),
        figure,
        wheelFigure,
      ),
      h(
        'aside',
        { class: 'card detail', 'aria-labelledby': 'detail-title' },
        h('h2', { id: 'detail-title', class: 'eyebrow' }, 'Explanation'),
        h('div', { 'aria-live': 'polite' }, detail),
      ),
    ),
    section(
      'activations-title',
      'Activations',
      h(
        'div',
        { class: 'two-col' },
        activationTable('Personality (conscious)', chart.personality, 'at birth'),
        activationTable('Design (unconscious)', chart.design, '88 degrees of Sun earlier'),
      ),
    ),
    centersBlock(chart),
    channelsBlock(chart),
  );
  return root;
}

/** The chart view: hero, birth form, saved people and the full result. */
export function chartView(ctx: ViewContext, person: BirthInput | undefined): HTMLElement {
  const resultHost = h('div', { class: 'result-host', 'aria-live': 'polite' });
  const form = createBirthForm({
    idPrefix: 'hd-chart',
    submitLabel: 'Cast chart',
    onSubmit: (input) => ctx.navigate(buildHash({ name: 'chart', person: input })),
  });
  const saved = createSavedList(ctx.store, {
    loadLabel: 'Load',
    onLoad: (input) => ctx.navigate(buildHash({ name: 'chart', person: input })),
  });

  const root = h('div', { class: 'view view-chart' });
  if (!person) root.appendChild(hero());
  root.appendChild(
    h(
      'section',
      { class: 'card form-card', id: 'birth-form-card', 'aria-labelledby': 'form-title' },
      h('h2', { id: 'form-title' }, person ? 'Birth details' : 'Enter your birth details'),
      h(
        'p',
        { class: 'note' },
        'Birth time precision matters: the Moon moves about half a degree per hour, and a few minutes can change a line or even a gate. Use a birth certificate time if you have one. Everything is computed locally in your browser; nothing is uploaded.',
      ),
      form.element,
      saved.element,
    ),
  );
  root.appendChild(resultHost);

  if (person) {
    form.setValues(person);
    try {
      const chart = computeChart(person);
      render(resultHost, renderResult(chart, ctx, saved.refresh));
      const title = resultHost.querySelector<HTMLElement>('#result-title');
      queueMicrotask(() => title?.focus({ preventScroll: false }));
    } catch (error) {
      render(
        resultHost,
        h(
          'p',
          { class: 'error', role: 'alert' },
          `Could not compute this chart: ${error instanceof Error ? error.message : 'unknown error'}.`,
        ),
      );
    }
  }
  return root;
}
