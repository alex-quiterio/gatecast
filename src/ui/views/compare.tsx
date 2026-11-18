import { useMemo, useState } from 'preact/hooks';
import { compareCharts, computeChart } from '@engine';
import { CHANNELS, DYNAMICS } from '@content';
import type { BirthInput, Chart, DynamicKind } from '@/types';
import { compositeLegend, renderComposite } from '@ui/composite';
import { BirthForm } from '@ui/components/birth-form';
import { ChartCanvas } from '@ui/components/canvas';
import { Detail } from '@ui/components/detail';
import { Icon } from '@ui/components/icons';
import { ResizeHandle } from '@ui/components/resize-handle';
import { usePanelWidth } from '@ui/hooks';
import { CircuitCompare } from '@ui/components/circuit-compare';
import { Chip } from '@ui/components/info-button';
import { Tabs } from '@ui/components/tabs';
import { useToast } from '@ui/components/toast';
import { TrustedHtml } from '@ui/components/trusted-html';
import { useApp } from '@ui/context';
import { buildHash } from '@ui/router';
import { centerLabel, channelId, copyText, describeBirth, typeClass } from './common';

const DYNAMIC_ORDER: DynamicKind[] = [
  'electromagnetic',
  'companionship',
  'dominance',
  'compromise',
];

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'channels', label: 'Channels' },
  { id: 'explain', label: 'Explanation' },
] as const;
type CompareTab = (typeof TABS)[number]['id'];

function ownerText(kind: DynamicKind, owner: string): string {
  if (kind === 'electromagnetic') return 'Completed only when you are together';
  if (kind === 'companionship') return 'Both of you have it';
  return `Complete in ${owner}'s chart`;
}

/** One person's input: pick a saved person or fill the form. */
function Slot({
  label,
  prefix,
  initial,
  onChange,
}: {
  label: string;
  prefix: string;
  initial: BirthInput | undefined;
  onChange: (input: BirthInput) => void;
}) {
  const { people } = useApp();
  const [value, setValue] = useState(initial);
  const [version, setVersion] = useState(0);
  const [ready, setReady] = useState(
    initial ? `${label} is set: ${initial.name || 'unnamed'}, ${initial.date}.` : '',
  );
  const accept = (input: BirthInput): void => {
    setValue(input);
    setReady(`${label} is set: ${input.name || 'unnamed'}, ${input.date}.`);
    onChange(input);
  };
  return (
    <section class="slot" aria-label={label}>
      <h3 class="slot-title">{label}</h3>
      {people.length > 0 ? (
        <div class="field">
          <label for={`${prefix}-saved`}>Use a saved person</label>
          <select
            id={`${prefix}-saved`}
            value=""
            onChange={(e) => {
              const person = people.find((p) => p.id === e.currentTarget.value);
              if (person) {
                setVersion((v) => v + 1);
                accept(person.input);
              }
            }}
          >
            <option value="">Choose…</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.input.name || 'Unnamed'} ({p.input.date})
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <BirthForm
        key={version}
        idPrefix={prefix}
        submitLabel={`Use ${label}`}
        compact
        initial={value}
        onSubmit={accept}
      />
      <p class="status" aria-live="polite">
        {ready}
      </p>
    </section>
  );
}

function MiniSummary({ chart, label }: { chart: Chart; label: string }) {
  return (
    <div class={`mini ${typeClass(chart.type)}`}>
      <p class="micro">{label}</p>
      <h3>{chart.input.name || label}</h3>
      <p class="meta">{describeBirth(chart.input)}</p>
      <span class="type-name small">{chart.type}</span>
      <dl class="facts compact">
        {(
          [
            ['Authority', chart.authority],
            ['Profile', chart.profile],
            ['Definition', chart.definition],
            ['Defined centers', chart.definedCenters.map(centerLabel).join(', ') || 'None'],
          ] as const
        ).map(([k, v]) => (
          <div class="fact" key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Result({ a, b }: { a: Chart; b: Chart }) {
  const { urlFor } = useApp();
  const toast = useToast();
  const comparison = useMemo(() => compareCharts(a, b), [a, b]);
  const markup = useMemo(() => renderComposite(a, b, comparison), [a, b, comparison]);
  const legend = useMemo(() => compositeLegend(), []);
  const [tab, setTab] = useState<CompareTab>('overview');
  const [selected, setSelected] = useState<string | undefined>(undefined);
  const nameA = a.input.name || 'Person A';
  const nameB = b.input.name || 'Person B';

  const onClick = (event: MouseEvent): void => {
    const el = event.target instanceof Element ? event.target.closest('[data-tip]') : null;
    const key = el?.getAttribute('data-tip');
    if (key) {
      setSelected(key);
      setTab('explain');
    }
  };

  return (
    <section class="pane pane-center" aria-labelledby="result-title" onClick={onClick}>
      <header class="pane-head">
        <div class="title-block">
          <p class="micro">Comparison</p>
          <h2 id="result-title" tabIndex={-1}>
            {nameA} and {nameB}
          </h2>
        </div>
        <div class="result-bar">
          <button
            type="button"
            class="btn"
            onClick={() => {
              const url = urlFor(buildHash({ name: 'compare', a: a.input, b: b.input }));
              void copyText(url).then((ok) =>
                toast(
                  ok ? 'Link copied. It contains both birth details.' : `Copy this link: ${url}`,
                ),
              );
            }}
          >
            <Icon name="share" /> <span>Share link</span>
          </button>
          <button type="button" class="btn" onClick={() => window.print()}>
            <Icon name="print" /> <span>Print</span>
          </button>
        </div>
      </header>
      <div class="compare-people">
        <MiniSummary chart={a} label="Person A" />
        <MiniSummary chart={b} label="Person B" />
      </div>
      <div class="compare-body">
        <div class="canvas-col">
          <h3 class="micro canvas-title">Composite BodyGraph</h3>
          <ChartCanvas markup={markup} selected={selected} />
        </div>
        <aside id="inspector" class="inspector inspector-inline" aria-label="Inspector">
          <Tabs
            prefix="cmp"
            label="Comparison details"
            items={TABS}
            value={tab}
            onChange={(id) => setTab(id as CompareTab)}
            class="tabs-line"
          />
          <div
            class="pane-body"
            role="tabpanel"
            id={`cmp-panel-${tab}`}
            aria-labelledby={`cmp-tab-${tab}`}
          >
            {tab === 'overview' ? (
              <div class="stack">
                <div class="table-wrap">
                  <table class="data">
                    <caption>The four dynamics</caption>
                    <tbody>
                      {DYNAMIC_ORDER.map((kind) => (
                        <tr key={kind} class={`dyn-${kind}`}>
                          <th scope="row">
                            <Chip tip={`dynamic:${kind}`}>{DYNAMICS[kind]?.title ?? kind}</Chip>
                          </th>
                          <td class="num">{comparison.counts[kind]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <CircuitCompare a={a} b={b} composite={comparison.compositeChannels} />
                <div>
                  <h3 class="micro">Legend</h3>
                  <TrustedHtml class="legend" markup={legend} />
                </div>
                <div>
                  <h3 class="micro">Centers</h3>
                  {comparison.newlyDefinedCenters.length === 0 ? (
                    <p class="muted">No center becomes defined only through the combination.</p>
                  ) : (
                    <p>
                      Defined only when you are together:{' '}
                      {comparison.newlyDefinedCenters.map((c) => (
                        <Chip key={c} tip={`center:${c}`} class="chip-defined">
                          {centerLabel(c)}
                        </Chip>
                      ))}
                    </p>
                  )}
                  <p class="muted small">
                    Defined together:{' '}
                    {comparison.compositeDefinedCenters.map(centerLabel).join(', ') || 'none'}.
                  </p>
                </div>
              </div>
            ) : null}
            {tab === 'channels' ? (
              <div class="table-wrap">
                <table class="data">
                  <caption>Compared channels ({comparison.channels.length})</caption>
                  <tbody>
                    {comparison.channels.length === 0 ? (
                      <tr>
                        <td class="empty-cell">No channels to compare.</td>
                      </tr>
                    ) : (
                      comparison.channels.map((c) => {
                        const id = channelId(c);
                        const info = (
                          CHANNELS as Record<string, { name: string; summary: string } | undefined>
                        )[id];
                        const owner =
                          c.owner === 'a' ? nameA : c.owner === 'b' ? nameB : 'Both together';
                        return (
                          <tr
                            key={id}
                            class={`dyn-${c.kind} ${selected === `channel:${id}` ? 'is-selected' : ''}`.trim()}
                          >
                            <th scope="row">
                              <Chip tip={`channel:${id}`} class="chip-mono">
                                {id}
                              </Chip>
                            </th>
                            <td>
                              <span class="gate-name">{info?.name ?? ''}</span>
                              <span class="cell-sub">
                                {ownerText(c.kind, owner)} · {centerLabel(c.centers[0])} to{' '}
                                {centerLabel(c.centers[1])}
                              </span>
                              <Chip tip={`dynamic:${c.kind}`} class="chip-dyn">
                                {DYNAMICS[c.kind]?.title ?? c.kind}
                              </Chip>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            ) : null}
            {tab === 'explain' ? (
              <div aria-live="polite">
                <Detail tipKey={selected ?? 'dynamic:electromagnetic'} />
              </div>
            ) : null}
          </div>
        </aside>
      </div>
    </section>
  );
}

/** The compare view: two people in, composite chart and dynamics out. */
export function CompareView({ a, b }: { a: BirthInput | undefined; b: BirthInput | undefined }) {
  const { navigate } = useApp();
  const [personA, setA] = useState(a);
  const [personB, setB] = useState(b);
  const [open, setOpen] = useState(!(a && b));
  const panel = usePanelWidth();
  const change = (next: { a?: BirthInput | undefined; b?: BirthInput | undefined }): void => {
    const na = 'a' in next ? next.a : personA;
    const nb = 'b' in next ? next.b : personB;
    if (na && nb) navigate(buildHash({ name: 'compare', a: na, b: nb }));
  };

  const result = useMemo(() => {
    if (!a || !b) return undefined;
    try {
      return { a: computeChart(a), b: computeChart(b) };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'unknown error' };
    }
  }, [a, b]);

  const slots = (
    <>
      <Slot
        label="Person A"
        prefix="hd-a"
        initial={a}
        onChange={(i) => {
          setA(i);
          change({ a: i });
        }}
      />
      <Slot
        label="Person B"
        prefix="hd-b"
        initial={b}
        onChange={(i) => {
          setB(i);
          change({ b: i });
        }}
      />
    </>
  );

  if (!result) {
    return (
      <div class="view start">
        <header class="page-head">
          <p class="micro">Relationships</p>
          <h1>Compare two charts</h1>
          <p class="lead">
            See how two designs meet: where channels complete each other, where one person leads and
            where you simply share a colour. All computed on this device.
          </p>
        </header>
        <div class="slots">{slots}</div>
      </div>
    );
  }
  return (
    <div
      class={`workspace workspace-compare ${open ? 'form-open' : 'form-closed'}`}
      style={panel.width ? `--left-open-w:${panel.width}px` : undefined}
    >
      <aside class="pane pane-left" aria-label="People">
        <button
          type="button"
          class="pane-toggle"
          aria-expanded={open}
          aria-controls="people-panel"
          onClick={() => setOpen(!open)}
        >
          <Icon name="sidebar" />
          <span class="pane-toggle-label">People</span>
          <Icon name="chevron" size={12} class="icon chev" />
        </button>
        <div id="people-panel" class="pane-body" hidden={!open}>
          {slots}
        </div>
        {open ? (
          <ResizeHandle
            width={panel.width}
            onChange={(w) => panel.setWidth(w, false)}
            onCommit={(w) => panel.setWidth(w, true)}
            onReset={panel.reset}
            label="Resize the people panel"
          />
        ) : null}
      </aside>
      {'error' in result ? (
        <p class="error" role="alert">
          Could not compare: {result.error}.
        </p>
      ) : (
        <Result a={result.a} b={result.b} />
      )}
    </div>
  );
}
