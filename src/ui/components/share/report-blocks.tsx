import type { VNode } from 'preact';
import { DISCLAIMER } from '@content';
import { renderBodygraph } from '@ui/bodygraph';
import { renderComposite } from '@ui/composite';
import { renderWheel } from '@ui/wheel';
import { DYNAMIC_DASH } from '@ui/palette';
import { qrSvg } from '@ui/share/qr';
import type { ComparedChannel } from '@/types';
import type {
  ActivationRow,
  CenterRow,
  ChannelRow,
  LineEntry,
  PersonModel,
  ReportModel,
} from '@ui/share/report-model';
import { stripSvgMeta } from '@ui/share/svg-meta';
import type { SectionId } from '@ui/share/types';
import type { ShareSubject } from '@ui/share/types';

/** One unsplittable piece of the report. */
export interface ReportBlock {
  id: string;
  node: VNode;
  keepWithNext?: boolean;
  breakBefore?: boolean;
  /** Rough height in mm, used before the browser has measured anything. */
  estimateMm: number;
}

/** What the blocks need beyond the model: the live charts for the graphics. */
export interface BlockSource {
  model: ReportModel;
  subject: ShareSubject;
  /** Prefix that keeps SVG ids unique when blocks are rendered twice. */
  idPrefix: string;
}

const SECTION_TITLES: Record<SectionId, string> = {
  summary: 'Summary',
  activations: 'Activations',
  centers: 'Centers and channels',
  circuits: 'Circuits',
  lines: 'Your lines',
  wheel: 'Gate wheel',
  glossary: 'Glossary',
};

function Svg({ markup, class: className }: { markup: string; class?: string }): VNode {
  return (
    <div
      class={className ?? 'rp-graph'}
      dangerouslySetInnerHTML={{ __html: stripSvgMeta(markup) }}
    />
  );
}

function Heading({ children, sub }: { children: string; sub?: string }): VNode {
  return (
    <div class="rp-h2">
      <h2>{children}</h2>
      {sub ? <p class="rp-sub">{sub}</p> : null}
    </div>
  );
}

function Facts({ p }: { p: PersonModel }): VNode {
  const rows: [string, string][] = [
    ['Strategy', p.strategy],
    ['Authority', p.authority],
    ['Profile', p.profile],
    ['Definition', p.definition],
    ['Not-self theme', p.notSelf],
  ];
  return (
    <dl class="rp-facts">
      {rows.map(([k, v]) => (
        <div key={k}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function TypeLine({ p }: { p: PersonModel }): VNode {
  return (
    <div class="rp-type">
      <span class="rp-label">Type</span>
      <strong>{p.type}</strong>
      {p.tagline ? <em>{p.tagline}</em> : null}
    </div>
  );
}

function CrossCard({ p }: { p: PersonModel }): VNode {
  return (
    <div class="rp-card rp-cross">
      <span class="rp-label">Incarnation Cross</span>
      <strong>{p.cross.title}</strong>
      <span class="rp-muted">
        {p.cross.angle} · {p.cross.quarter}
      </span>
      {p.cross.theme ? <em>{p.cross.theme}</em> : null}
      {p.cross.summary ? <p>{p.cross.summary}</p> : null}
    </div>
  );
}

function stateTag(state: 'Defined' | 'Open'): VNode {
  return <span class={`rp-tag rp-tag--${state === 'Defined' ? 'solid' : 'outline'}`}>{state}</span>;
}

function CenterItem({ c }: { c: CenterRow }): VNode {
  return (
    <div class="rp-row">
      <div class="rp-row__head">
        <strong>{c.label}</strong>
        {stateTag(c.state)}
        {c.motor ? <span class="rp-muted rp-small">Motor</span> : null}
      </div>
      <p>{c.text}</p>
    </div>
  );
}

function ChannelItem({ c }: { c: ChannelRow }): VNode {
  const meta = [c.circuit, c.stream].filter(Boolean).join(' · ');
  return (
    <div class="rp-row">
      <div class="rp-row__head">
        <strong class="rp-mono">{c.id}</strong>
        <strong>{c.name}</strong>
        {meta ? <span class="rp-muted rp-small">{meta}</span> : null}
      </div>
      {c.summary ? <p>{c.summary}</p> : null}
    </div>
  );
}

function ActivationTable({
  rows,
  which,
}: {
  rows: readonly ActivationRow[];
  which: 'Personality' | 'Design';
}): VNode {
  return (
    <table class={`rp-table rp-table--${which.toLowerCase()}`}>
      <caption>
        <span class="rp-mark">{which === 'Personality' ? '●' : '○'}</span> {which}
        <span class="rp-muted">{which === 'Personality' ? ' (conscious)' : ' (unconscious)'}</span>
      </caption>
      <thead>
        <tr>
          <th scope="col">Planet</th>
          <th scope="col">Activation</th>
          <th scope="col">Gate</th>
          <th scope="col">Line</th>
          <th scope="col">Center</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.planet}>
            <td>
              <span class="rp-glyph">{r.glyph}</span> {r.planet}
            </td>
            <td class="rp-mono">{r.label}</td>
            <td>
              {r.gate}
              {r.gateName ? ` ${r.gateName}` : ''}
            </td>
            <td>{r.lineTitle}</td>
            <td>{r.center}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Bars({ p }: { p: PersonModel }): VNode {
  return (
    <div class="rp-bars">
      {p.bars.map((b) => (
        <div class="rp-bar" key={b.label}>
          <span>{b.label}</span>
          <span class="rp-bar__track" aria-hidden="true">
            <span class="rp-bar__fill" style={{ width: `${b.percent}%` }} />
          </span>
          <span class="rp-mono">
            {b.count} ({b.percent}%)
          </span>
        </div>
      ))}
    </div>
  );
}

function LineItem({ e }: { e: LineEntry }): VNode {
  return (
    <div class="rp-line">
      <div class="rp-line__head">
        <strong class="rp-mono">{e.key}</strong>
        <strong>{e.title}</strong>
        <span class="rp-muted rp-small">
          {e.gateName ? `Gate ${e.gate}, ${e.gateName}` : `Gate ${e.gate}`} · {e.source}
        </span>
      </div>
      <p>{e.summary}</p>
      {e.flow ? (
        <p class="rp-flow">
          <span class="rp-label">Flowing</span> {e.flow}
        </p>
      ) : null}
      {e.stress ? (
        <p class="rp-flow">
          <span class="rp-label">Under pressure</span> {e.stress}
        </p>
      ) : null}
    </div>
  );
}

const DASH_LABEL: Record<string, string> = {
  electromagnetic: 'solid line',
  companionship: 'dashed line',
  dominance: 'dotted line',
  compromise: 'dash-dot line',
};

function dynamicSwatch(kind: ComparedChannel['kind']): VNode {
  const dash = DYNAMIC_DASH[kind];
  return (
    <svg class="rp-swatch" width="30" height="8" viewBox="0 0 40 10" aria-hidden="true">
      <line
        x1="3"
        y1="5"
        x2="37"
        y2="5"
        stroke="currentColor"
        stroke-width="5"
        stroke-dasharray={dash}
        stroke-linecap={kind === 'dominance' ? 'round' : 'butt'}
      />
    </svg>
  );
}

function sectionBlocks(
  src: BlockSource,
  id: SectionId,
  index: number,
  titled: boolean,
): ReportBlock[] {
  const { model, subject } = src;
  const p = model.people[index] as PersonModel;
  const key = `${id}-${index}`;
  const label = (base: string): string => (titled ? `${p.name} · ${base}` : base);
  const heading = (base: string, brk = false): ReportBlock => ({
    id: `${key}-h`,
    node: <Heading>{label(base)}</Heading>,
    keepWithNext: true,
    breakBefore: brk,
    estimateMm: 14,
  });
  const out: ReportBlock[] = [];
  switch (id) {
    case 'summary':
    case 'glossary':
      break;
    case 'activations': {
      out.push(heading(SECTION_TITLES.activations));
      out.push({
        id: `${key}-p`,
        node: <ActivationTable rows={p.personality} which="Personality" />,
        estimateMm: 100,
      });
      out.push({
        id: `${key}-d`,
        node: <ActivationTable rows={p.design} which="Design" />,
        estimateMm: 100,
      });
      break;
    }
    case 'centers': {
      out.push(heading(SECTION_TITLES.centers));
      p.centers.forEach((c) =>
        out.push({ id: `${key}-c-${c.id}`, node: <CenterItem c={c} />, estimateMm: 20 }),
      );
      if (p.channels.length > 0) {
        out.push({
          id: `${key}-ch-h`,
          node: (
            <div class="rp-h3">
              <h3>Channels</h3>
            </div>
          ),
          keepWithNext: true,
          estimateMm: 9,
        });
        p.channels.forEach((c) =>
          out.push({ id: `${key}-ch-${c.id}`, node: <ChannelItem c={c} />, estimateMm: 18 }),
        );
      }
      if (p.hangingGates.length > 0) {
        out.push({
          id: `${key}-hang`,
          node: (
            <p class="rp-note">
              Gates not part of a complete channel (hanging gates): {p.hangingGates.join(', ')}.
            </p>
          ),
          estimateMm: 10,
        });
      }
      break;
    }
    case 'circuits': {
      out.push(heading(SECTION_TITLES.circuits));
      out.push({
        id: `${key}-bars`,
        node: (
          <div>
            <Bars p={p} />
            <p class="rp-lead">{p.circuitSentence}</p>
          </div>
        ),
        estimateMm: 42,
      });
      if (p.dominant) {
        out.push({
          id: `${key}-dom`,
          node: (
            <div class="rp-card">
              <strong>{p.dominant.title}</strong>
              <p>{p.dominant.summary}</p>
            </div>
          ),
          estimateMm: 28,
        });
      }
      break;
    }
    case 'lines': {
      if (p.lines.length === 0) break;
      out.push(heading(SECTION_TITLES.lines, true));
      out.push({
        id: `${key}-intro`,
        node: (
          <p class="rp-note">
            Each line below is one the chart activates. These are tendencies to explore, not rules:
            keep what rings true.
          </p>
        ),
        keepWithNext: true,
        estimateMm: 12,
      });
      p.lines.forEach((e) => {
        out.push({
          id: `${key}-l-${e.key}`,
          node: <LineItem e={e} />,
          estimateMm: 26 + (e.flow ? 8 : 0) + (e.stress ? 8 : 0),
        });
      });
      break;
    }
    case 'wheel': {
      const chart = subject.kind === 'chart' ? subject.chart : index === 0 ? subject.a : subject.b;
      out.push(heading(SECTION_TITLES.wheel, true));
      out.push({
        id: `${key}-wheel`,
        node: (
          <Svg
            class="rp-wheel"
            markup={renderWheel(chart, { idPrefix: `${src.idPrefix}-w${index}` })}
          />
        ),
        estimateMm: 165,
      });
      break;
    }
  }
  return out;
}

function summaryBlocks(src: BlockSource): ReportBlock[] {
  const { model, subject } = src;
  const out: ReportBlock[] = [];
  const name = model.preparedFor;
  if (model.kind === 'chart' && subject.kind === 'chart') {
    const p = model.people[0] as PersonModel;
    out.push({
      id: 'cover',
      estimateMm: 140,
      node: (
        <div class="rp-cover">
          <p class="rp-eyebrow">{model.title}</p>
          <h1>{p.name || 'Human Design chart'}</h1>
          {p.birth ? <p class="rp-birth">{p.birth}</p> : null}
          <div class="rp-cover__grid">
            <Svg markup={renderBodygraph(subject.chart, { idPrefix: `${src.idPrefix}-bg` })} />
            <div>
              <TypeLine p={p} />
              <Facts p={p} />
            </div>
          </div>
        </div>
      ),
    });
    out.push({ id: 'cross', node: <CrossCard p={p} />, estimateMm: 44 });
    if (p.typeSummary || p.authoritySummary) {
      out.push({
        id: 'about',
        estimateMm: 52,
        node: (
          <div class="rp-about">
            {p.typeSummary ? (
              <div>
                <span class="rp-label">About the {p.type} type</span>
                <p>{p.typeSummary}</p>
              </div>
            ) : null}
            {p.authoritySummary ? (
              <div>
                <span class="rp-label">About {p.authority}</span>
                <p>{p.authoritySummary}</p>
              </div>
            ) : null}
          </div>
        ),
      });
    }
    return out;
  }
  if (subject.kind !== 'compare' || !model.compare) return out;
  const cmp = model.compare;
  const [a, b] = model.people as [PersonModel, PersonModel];
  out.push({
    id: 'cover',
    estimateMm: 150,
    node: (
      <div class="rp-cover">
        <p class="rp-eyebrow">{model.title}</p>
        <h1>{name}</h1>
        <div class="rp-cover__two">
          {[
            { p: a, chart: subject.a, i: 0 },
            { p: b, chart: subject.b, i: 1 },
          ].map(({ p, chart, i }) => (
            <div key={i} class="rp-person">
              <h3>
                <span class="rp-mark">{i === 0 ? '○' : '□'}</span> {p.name}
              </h3>
              {p.birth ? <p class="rp-birth">{p.birth}</p> : null}
              <Svg markup={renderBodygraph(chart, { idPrefix: `${src.idPrefix}-bg${i}` })} />
              <TypeLine p={p} />
              <Facts p={p} />
            </div>
          ))}
        </div>
      </div>
    ),
  });
  out.push({
    id: 'cmp-h',
    node: <Heading>Composite</Heading>,
    keepWithNext: true,
    breakBefore: true,
    estimateMm: 14,
  });
  out.push({
    id: 'cmp-composite',
    estimateMm: 130,
    node: (
      <div class="rp-composite">
        <Svg
          markup={renderComposite(subject.a, subject.b, subject.comparison, {
            legend: false,
            idPrefix: `${src.idPrefix}-cmp`,
          })}
        />
        <div>
          <span class="rp-label">Channel dynamics</span>
          <ul class="rp-dyn">
            {cmp.counts.map((c) => (
              <li key={c.kind} class={`rp-dyn__${c.kind}`}>
                {dynamicSwatch(c.kind)}
                <span>
                  <strong>{c.label}</strong> <span class="rp-mono">{c.count}</span>
                  <span class="rp-muted rp-small">
                    {' '}
                    ({DASH_LABEL[c.kind]}): {c.meaning}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <p class="rp-note">
            Circle marks show {a.name}, square marks show {b.name}.
          </p>
          {cmp.compositeDefined.length > 0 ? (
            <p class="rp-note">Defined in the composite: {cmp.compositeDefined.join(', ')}.</p>
          ) : null}
          {cmp.newlyDefined.length > 0 ? (
            <p class="rp-note">Defined only together: {cmp.newlyDefined.join(', ')}.</p>
          ) : null}
        </div>
      </div>
    ),
  });
  if (cmp.channels.length > 0) {
    out.push({
      id: 'cmp-channels',
      estimateMm: 12 + cmp.channels.length * 7,
      node: (
        <table class="rp-table">
          <caption>Channels between you</caption>
          <thead>
            <tr>
              <th scope="col">Channel</th>
              <th scope="col">Name</th>
              <th scope="col">Dynamic</th>
              <th scope="col">Held by</th>
            </tr>
          </thead>
          <tbody>
            {cmp.channels.map((c) => (
              <tr key={c.id}>
                <td class="rp-mono">{c.id}</td>
                <td>{c.name}</td>
                <td>{c.dynamic}</td>
                <td>{c.owner || 'Both, or only together'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ),
    });
  }
  out.push({
    id: 'cmp-circuits',
    estimateMm: 34,
    node: (
      <div class="rp-card">
        <span class="rp-label">Circuits</span>
        <p>{cmp.sentence}</p>
        {cmp.pairTitle ? <strong>{cmp.pairTitle}</strong> : null}
        {cmp.pairSummary ? <p>{cmp.pairSummary}</p> : null}
      </div>
    ),
  });
  return out;
}

function glossaryBlocks(model: ReportModel): ReportBlock[] {
  if (model.glossary.length === 0) return [];
  return [
    {
      id: 'glossary-h',
      node: <Heading>{SECTION_TITLES.glossary}</Heading>,
      keepWithNext: true,
      breakBefore: true,
      estimateMm: 14,
    },
    ...model.glossary.map((g) => ({
      id: `glossary-${g.term}`,
      estimateMm: 16,
      node: (
        <div class="rp-gloss">
          <strong>{g.term}</strong>
          <p>{g.definition}</p>
        </div>
      ),
    })),
  ];
}

function closingBlocks(src: BlockSource): ReportBlock[] {
  const { model } = src;
  const out: ReportBlock[] = [];
  if (model.notes) {
    out.push({
      id: 'notes-h',
      node: <Heading>Notes</Heading>,
      keepWithNext: true,
      estimateMm: 14,
    });
    model.notes.split(/\n{1,}/).forEach((para, i) => {
      if (para.trim()) {
        out.push({ id: `notes-${i}`, node: <p class="rp-notes">{para}</p>, estimateMm: 12 });
      }
    });
  }
  const qr = model.showQr
    ? qrSvg(model.link, 0, 0, 100, { dark: '#000000', light: '#ffffff' })
    : '';
  out.push({
    id: 'closing',
    estimateMm: qr ? 62 : 38,
    node: (
      <div class="rp-closing">
        <div>
          <span class="rp-label">About this report</span>
          <p>{DISCLAIMER}</p>
          {model.preparedBy || model.contact ? (
            <p>
              <strong>{model.preparedBy ? `Prepared by ${model.preparedBy}` : ''}</strong>
              {model.preparedBy && model.contact ? ' · ' : ''}
              {model.contact}
            </p>
          ) : null}
          {qr ? (
            <p class="rp-small rp-muted">
              The QR code opens this chart in Gatecast. The link contains the birth details used to
              compute it, so share it only with people who may know them.
            </p>
          ) : null}
        </div>
        {qr ? (
          <svg
            class="rp-qr"
            viewBox="0 0 100 100"
            role="img"
            aria-label="QR code that opens this chart in Gatecast"
            dangerouslySetInnerHTML={{ __html: qr }}
          />
        ) : null}
      </div>
    ),
  });
  return out;
}

/**
 * The report as an ordered list of unsplittable blocks: the sections the
 * model enables (per person for a comparison), then the closing page content.
 */
export function buildBlocks(src: BlockSource): ReportBlock[] {
  const { model } = src;
  const out: ReportBlock[] = [];
  const has = (id: SectionId): boolean => model.sections.includes(id);
  if (has('summary')) out.push(...summaryBlocks(src));
  const detail: SectionId[] = ['activations', 'centers', 'circuits', 'lines', 'wheel'];
  model.people.forEach((_p, index) => {
    for (const id of detail) {
      if (has(id)) out.push(...sectionBlocks(src, id, index, model.kind === 'compare'));
    }
  });
  if (has('glossary')) out.push(...glossaryBlocks(model));
  out.push(...closingBlocks(src));
  return out;
}
