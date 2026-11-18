import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { computeChart } from '@engine';
import type { BirthInput, Chart } from '@/types';
import { renderBodygraph } from '@ui/bodygraph';
import { renderWheel } from '@ui/wheel';
import { summaryText } from '@ui/chart-facts';
import { BirthForm } from '@ui/components/birth-form';
import { ChartCanvas } from '@ui/components/canvas';
import { ActivationTable, CentersPanel, ChannelsPanel, KeyFacts } from '@ui/components/chart-parts';
import { Detail } from '@ui/components/detail';
import { Icon } from '@ui/components/icons';
import { Menu, type MenuItem } from '@ui/components/menu';
import { SavedList } from '@ui/components/saved-list';
import { StatusBar } from '@ui/components/status-bar';
import { Tabs } from '@ui/components/tabs';
import { useToast } from '@ui/components/toast';
import { useApp } from '@ui/context';
import { downloadBlob, exportPng, exportSvg } from '@ui/export-image';
import { useShortcuts } from '@ui/hooks';
import { buildHash } from '@ui/router';
import { encodePerson } from '@ui/share';
import { copyText, describeBirth, downloadText } from './common';

const INSPECTOR_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'activations', label: 'Activations' },
  { id: 'channels', label: 'Channels' },
  { id: 'centers', label: 'Centers' },
] as const;
type InspectorTab = (typeof INSPECTOR_TABS)[number]['id'];

const FIGURE_TABS = [
  { id: 'body', label: 'BodyGraph' },
  { id: 'wheel', label: 'Gate wheel' },
] as const;

function safeFileName(input: BirthInput): string {
  return input.name ? input.name.replace(/[^\p{L}\p{N}]+/gu, '-') : input.date;
}

function isWide(): boolean {
  try {
    return window.matchMedia('(min-width: 1280px)').matches;
  } catch {
    return false;
  }
}

/** The "Start a chart" panel: logo, value proposition, the form, privacy note. */
function StartPanel({ onSubmit }: { onSubmit: (input: BirthInput) => void }) {
  const { people, store, refreshPeople, navigate } = useApp();
  return (
    <div class="view start">
      <section class="panel start-panel" aria-labelledby="start-title">
        <header class="start-head">
          <img src="./logo.svg" alt="" width="40" height="40" class="start-logo" />
          <div>
            <h1 id="start-title">Start a chart</h1>
            <p class="muted">Cast your Human Design chart. In your browser. Nothing leaves it.</p>
          </div>
        </header>
        <BirthForm idPrefix="hd-chart" submitLabel="Cast chart" onSubmit={onSubmit} />
        <p class="note">
          Birth time precision matters: the Moon moves about half a degree per hour, and a few
          minutes can change a line or even a gate. Use a birth certificate time if you have one.
          Everything is computed locally; nothing is uploaded.
        </p>
        {people.length > 0 ? (
          <div class="inline-saved">
            <h2 class="micro">Saved on this device</h2>
            <SavedList
              people={people}
              loadLabel="Load"
              onOpen={(input) => navigate(buildHash({ name: 'chart', person: input }))}
              onDelete={(p) => {
                store.remove(p.id);
                refreshPeople();
              }}
            />
          </div>
        ) : null}
      </section>
    </div>
  );
}

function Workspace({ chart }: { chart: Chart }) {
  const { navigate, urlFor, store, people, refreshPeople, hash } = useApp();
  const toast = useToast();
  const input = chart.input;
  const [selected, setSelected] = useState<string | undefined>(undefined);
  const [tab, setTab] = useState<InspectorTab>('overview');
  const [figure, setFigure] = useState<'body' | 'wheel'>('body');
  const [numbers, setNumbers] = useState(true);
  const [layers, setLayers] = useState({ personality: true, design: true });
  const [formOpen, setFormOpen] = useState(() => isWide());
  const title = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    queueMicrotask(() => title.current?.focus({ preventScroll: false }));
  }, []);

  const bodyMarkup = useMemo(
    () => renderBodygraph(chart, { showGateNumbers: numbers, idPrefix: 'main' }),
    [chart, numbers],
  );
  const wheelMarkup = useMemo(() => renderWheel(chart), [chart]);
  const markup = figure === 'body' ? bodyMarkup : wheelMarkup;
  const fileBase = `chart-${safeFileName(input)}`;

  const save = (): void => {
    const result = store.add(input);
    toast(result.ok ? `Saved ${input.name || 'this chart'} on this device.` : result.reason);
    if (result.ok) refreshPeople();
  };
  const share = (): void => {
    const url = urlFor(buildHash({ name: 'chart', person: input }));
    void copyText(url).then((ok) =>
      toast(
        ok ? 'Link copied. It contains the birth details you entered.' : `Copy this link: ${url}`,
      ),
    );
  };
  const items: MenuItem[] = [
    {
      id: 'json',
      label: 'Download JSON',
      icon: 'download',
      onSelect: () => {
        downloadText(`${fileBase}.json`, JSON.stringify(chart, null, 2), 'application/json');
        toast('Chart downloaded as JSON.');
      },
    },
    {
      id: 'svg',
      label: figure === 'body' ? 'Export BodyGraph as SVG' : 'Export wheel as SVG',
      icon: 'image',
      onSelect: () => {
        downloadText(`${fileBase}-${figure}.svg`, exportSvg(markup), 'image/svg+xml');
        toast('SVG exported.');
      },
    },
    {
      id: 'png',
      label: figure === 'body' ? 'Export BodyGraph as PNG' : 'Export wheel as PNG',
      icon: 'image',
      onSelect: () => {
        void exportPng(markup).then((blob) => {
          if (blob) {
            downloadBlob(`${fileBase}-${figure}.png`, blob);
            toast('PNG exported.');
          } else toast('Your browser could not render the PNG. Try the SVG export.');
        });
      },
    },
    {
      id: 'copy',
      label: 'Copy summary as text',
      icon: 'copy',
      onSelect: () =>
        void copyText(summaryText(chart)).then((ok) =>
          toast(ok ? 'Summary copied.' : 'Could not copy the summary.'),
        ),
    },
    {
      id: 'print',
      label: 'Print / save as PDF',
      icon: 'print',
      hint: 'P',
      onSelect: () => window.print(),
    },
  ];

  useShortcuts({
    s: save,
    u: share,
    n: () => setNumbers((v) => !v),
    v: () => setFigure((f) => (f === 'body' ? 'wheel' : 'body')),
    p: () => window.print(),
  });

  const select = (key: string, fromCanvas: boolean): void => {
    setSelected(key);
    if (fromCanvas) setTab('overview');
  };
  const onClick = (event: MouseEvent): void => {
    const el = event.target instanceof Element ? event.target.closest('[data-tip]') : null;
    const key = el?.getAttribute('data-tip');
    if (el && key) select(key, !el.closest('.inspector'));
  };
  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const el = event.target instanceof Element ? event.target.closest('svg [data-tip]') : null;
    const key = el?.getAttribute('data-tip');
    if (key) {
      event.preventDefault();
      select(key, true);
    }
  };

  const activeId = encodePerson(input);
  const layerClass =
    (layers.personality ? '' : 'hide-personality ') + (layers.design ? '' : 'hide-design');

  return (
    <div
      class={`workspace ${formOpen ? 'form-open' : 'form-closed'}`}
      onClick={onClick}
      onKeyDown={onKeyDown}
    >
      <aside class="pane pane-left" aria-label="Birth data">
        <button
          type="button"
          class="pane-toggle"
          aria-expanded={formOpen}
          aria-controls="birth-panel"
          onClick={() => setFormOpen(!formOpen)}
        >
          <Icon name="sidebar" />
          <span class="pane-toggle-label">Birth data</span>
          <Icon name="chevron" size={12} class="icon chev" />
        </button>
        <div id="birth-panel" class="pane-body" hidden={!formOpen}>
          <BirthForm
            key={hash}
            idPrefix="hd-chart"
            submitLabel="Update chart"
            compact
            initial={input}
            onSubmit={(next) => navigate(buildHash({ name: 'chart', person: next }))}
          />
          {people.length > 0 ? (
            <div class="inline-saved">
              <h2 class="micro">Saved on this device</h2>
              <SavedList
                people={people}
                activeId={activeId}
                loadLabel="Load"
                detailed={false}
                onOpen={(p) => navigate(buildHash({ name: 'chart', person: p }))}
                onDelete={(p) => {
                  store.remove(p.id);
                  refreshPeople();
                }}
              />
            </div>
          ) : null}
        </div>
      </aside>

      <section class="pane pane-center" aria-labelledby="result-title">
        <header class="pane-head">
          <div class="title-block">
            <p class="micro">Chart</p>
            <h2 id="result-title" tabIndex={-1} ref={title}>
              {input.name || 'Your chart'}
            </h2>
            <p class="meta">{describeBirth(input)}</p>
          </div>
          <div class="result-bar">
            <button type="button" class="btn" onClick={save}>
              <Icon name="save" /> <span>Save</span>
            </button>
            <button type="button" class="btn" onClick={share}>
              <Icon name="share" /> <span>Share link</span>
            </button>
            <Menu label="Export" icon="download" items={items} />
          </div>
        </header>
        <KeyFacts chart={chart} />
        <ChartCanvas
          markup={markup}
          selected={selected}
          resetKey={figure}
          shape={figure === 'wheel' ? 'square' : 'portrait'}
          class={layerClass}
          toolbar={
            <>
              <Tabs
                prefix="fig"
                label="Chart display"
                items={FIGURE_TABS}
                value={figure}
                onChange={(id) => setFigure(id === 'wheel' ? 'wheel' : 'body')}
                class="tabs-seg"
              />
              {figure === 'body' ? (
                <>
                  <label class="toggle">
                    <input
                      type="checkbox"
                      checked={numbers}
                      onChange={(e) => setNumbers(e.currentTarget.checked)}
                    />
                    <span>Gate numbers</span>
                  </label>
                  <label class="toggle toggle-personality">
                    <input
                      type="checkbox"
                      checked={layers.personality}
                      onChange={(e) =>
                        setLayers({ ...layers, personality: e.currentTarget.checked })
                      }
                    />
                    <span>Personality</span>
                  </label>
                  <label class="toggle toggle-design">
                    <input
                      type="checkbox"
                      checked={layers.design}
                      onChange={(e) => setLayers({ ...layers, design: e.currentTarget.checked })}
                    />
                    <span>Design</span>
                  </label>
                </>
              ) : null}
            </>
          }
        />
      </section>

      <aside id="inspector" class="pane pane-right inspector" aria-label="Inspector">
        <Tabs
          prefix="insp"
          label="Inspector"
          items={INSPECTOR_TABS}
          value={tab}
          onChange={(id) => setTab(id as InspectorTab)}
          class="tabs-line"
        />
        <div
          class="pane-body"
          role="tabpanel"
          id={`insp-panel-${tab}`}
          aria-labelledby={`insp-tab-${tab}`}
          aria-live={tab === 'overview' ? 'polite' : 'off'}
        >
          {tab === 'overview' ? (
            <>
              {selected ? (
                <button
                  type="button"
                  class="btn btn-sm btn-ghost clear-selection"
                  onClick={() => setSelected(undefined)}
                >
                  <Icon name="close" size={12} /> Clear selection
                </button>
              ) : null}
              <Detail tipKey={selected ?? `type:${chart.type}`} chart={chart} />
            </>
          ) : null}
          {tab === 'activations' ? (
            <div class="stack">
              <ActivationTable
                title="Personality (conscious), at birth"
                source="personality"
                rows={chart.personality}
                selected={selected}
              />
              <ActivationTable
                title="Design (unconscious), 88 degrees of Sun earlier"
                source="design"
                rows={chart.design}
                selected={selected}
              />
            </div>
          ) : null}
          {tab === 'channels' ? <ChannelsPanel chart={chart} selected={selected} /> : null}
          {tab === 'centers' ? <CentersPanel chart={chart} selected={selected} /> : null}
        </div>
      </aside>

      <StatusBar chart={chart} />
    </div>
  );
}

/** The chart view: a start panel, or the three-pane workspace for a computed chart. */
export function ChartView({ person }: { person: BirthInput | undefined }) {
  const { navigate } = useApp();
  const result = useMemo(() => {
    if (!person) return undefined;
    try {
      return { chart: computeChart(person) };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'unknown error' };
    }
  }, [person]);

  if (!person) {
    return (
      <StartPanel onSubmit={(input) => navigate(buildHash({ name: 'chart', person: input }))} />
    );
  }
  if (result && 'error' in result) {
    return (
      <div class="view start">
        <p class="error" role="alert">
          Could not compute this chart: {result.error}.
        </p>
      </div>
    );
  }
  return result?.chart ? <Workspace chart={result.chart} /> : null;
}
