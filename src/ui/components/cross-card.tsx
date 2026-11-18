import type { Chart } from '@/types';
import { CROSS_ANGLES, GATES, QUARTERS } from '@content';
import type { Quarter } from '@content/schema';
import { quarterStrip, crossFacts } from '@ui/cross-logic';
import { Chip, InfoButton } from './info-button';

/** The 16 gates of a quarter as a strip of small chips; the chart's cross gates stand out. */
export function GateStrip({ quarter, chart }: { quarter: Quarter; chart?: Chart | undefined }) {
  const gates = quarterStrip(quarter, chart);
  if (gates.length === 0) return null;
  return (
    <ul class="gate-strip" aria-label={`The 16 gates of the ${QUARTERS[quarter].title}`}>
      {gates.map((g) => (
        <li key={g.gate}>
          <Chip
            tip={`gate:${g.gate}`}
            class={`chip-mono strip-gate${g.sun ? ' is-sun' : g.cross ? ' is-cross' : ''}`}
          >
            {g.gate}
            {g.sun ? <span class="sr-only"> (your personality Sun gate)</span> : null}
            {!g.sun && g.cross ? <span class="sr-only"> (in your cross)</span> : null}
          </Chip>
        </li>
      ))}
    </ul>
  );
}

const GATE_ROLES: readonly (readonly [keyof Chart['crossGates'], string])[] = [
  ['personalitySun', 'Personality Sun'],
  ['personalityEarth', 'Personality Earth'],
  ['designSun', 'Design Sun'],
  ['designEarth', 'Design Earth'],
];

/**
 * The chart's Incarnation Cross for the inspector Overview: title, angle and
 * why, quarter with a 16-gate strip, and the four gates.
 */
export function CrossCard({ chart }: { chart: Chart }) {
  const cross = crossFacts(chart);
  const angle = CROSS_ANGLES[cross.angle];
  const quarter = QUARTERS[cross.quarter];
  return (
    <section class="cross-card" aria-labelledby="cross-card-title">
      <p class="eyebrow">
        Incarnation Cross <InfoButton tip={`cross:${cross.angle}`} label="Incarnation Cross" />
      </p>
      <h3 id="cross-card-title">{cross.title}</h3>
      {cross.name ? null : (
        <p class="muted small">
          No traditional name is listed for this cross yet. Its four gates still describe it.
        </p>
      )}
      <dl class="facts">
        <div class="fact">
          <dt>Angle</dt>
          <dd>
            <Chip tip={`cross:${cross.angle}`}>{angle.title}</Chip>
            {angle.summary ? <p class="fact-text">{angle.summary}</p> : null}
            <p class="fact-text why">{cross.reason}</p>
          </dd>
        </div>
        <div class="fact">
          <dt>Quarter</dt>
          <dd>
            <Chip tip={`quarter:${cross.quarter}`}>{quarter.title}</Chip>
            {quarter.theme ? <span class="quarter-theme"> {quarter.theme}</span> : null}
            {quarter.summary ? <p class="fact-text">{quarter.summary}</p> : null}
            <GateStrip quarter={cross.quarter} chart={chart} />
            <p class="muted small">
              Highlighted: your personality Sun gate and the rest of your cross.
            </p>
          </dd>
        </div>
        <div class="fact">
          <dt>The four gates</dt>
          <dd>
            <ul class="cross-gates">
              {GATE_ROLES.map(([key, label]) => {
                const n = cross.gates[key];
                return (
                  <li key={key}>
                    <span class="cross-role">{label}</span>
                    <Chip tip={`gate:${n}`} class="chip-mono">
                      {n}
                    </Chip>
                    <span class="gate-name">{GATES[n]?.name ?? ''}</span>
                  </li>
                );
              })}
            </ul>
          </dd>
        </div>
      </dl>
    </section>
  );
}
