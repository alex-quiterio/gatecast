import type { ComponentChildren } from 'preact';
import type {
  AuthorityName,
  CenterName,
  Chart,
  ChartType,
  DefinitionName,
  DynamicKind,
  PlanetName,
} from '@/types';
import {
  AUTHORITIES,
  CENTERS,
  CHANNELS,
  DEFINITIONS,
  DYNAMICS,
  GATES,
  GLOSSARY,
  PLANETS,
  PROFILES,
  TYPES,
  tipFor,
} from '@content';
import { centerLabel } from '@ui/views/common';

function Fact({ label, text }: { label: string; text: string | undefined }) {
  if (!text) return null;
  return (
    <div class="fact">
      <dt>{label}</dt>
      <dd>{text}</dd>
    </div>
  );
}

function Panel({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow: string;
  title: string;
  lead?: string | undefined;
  children?: ComponentChildren;
}) {
  return (
    <article class="detail-body">
      <p class="eyebrow">{eyebrow}</p>
      <h3>{title}</h3>
      {lead ? <p class="lead">{lead}</p> : null}
      <dl class="facts">{children}</dl>
    </article>
  );
}

/** Placeholder shown before anything is selected. */
export function EmptyDetail() {
  return (
    <p class="empty-hint">
      Select a gate, channel or center on the chart, or any underlined term, to read its full
      explanation here.
    </p>
  );
}

/** Props of {@link Detail}. */
export interface DetailProps {
  /** Same keys as `tipFor`: `gate:20`, `center:Throat`, ... */
  tipKey: string;
  /** Optional chart, to show how the item appears in it. */
  chart?: Chart | undefined;
}

/**
 * Full explanation for a tooltip key, built from the content module. Unknown
 * keys fall back to the tooltip text.
 */
export function Detail({ tipKey: key, chart }: DetailProps) {
  const at = key.indexOf(':');
  const kind = at >= 0 ? key.slice(0, at) : key;
  const value = at >= 0 ? key.slice(at + 1) : '';

  switch (kind) {
    case 'gate': {
      const gate = GATES[Number(value)];
      if (gate) {
        const source = chart?.gateSources[gate.number];
        const where =
          source === undefined
            ? undefined
            : source === 'both'
              ? 'Active in both your Personality and Design.'
              : `Active in your ${source === 'personality' ? 'Personality (conscious)' : 'Design (unconscious)'}.`;
        return (
          <Panel
            eyebrow={`Gate ${gate.number} · ${gate.iching}`}
            title={gate.name}
            lead={gate.keynote}
          >
            <Fact label="In depth" text={gate.summary} />
            <Fact label="When defined" text={gate.whenDefined} />
            <Fact label="In this chart" text={where} />
          </Panel>
        );
      }
      break;
    }
    case 'channel': {
      const channel = (
        CHANNELS as Record<string, (typeof CHANNELS)[keyof typeof CHANNELS] | undefined>
      )[value];
      if (channel) {
        const both = value.split('-').map((g) => GATES[Number(g)]?.name);
        const complete = chart?.channels.some((c) => `${c.gates[0]}-${c.gates[1]}` === value);
        return (
          <Panel eyebrow={`Channel ${value}`} title={channel.name} lead={channel.summary}>
            <Fact label="Circuit" text={channel.circuit} />
            <Fact label="Stream" text={channel.stream} />
            <Fact label="Gates" text={both.filter(Boolean).join(' + ')} />
            <Fact
              label="In this chart"
              text={
                chart
                  ? complete
                    ? 'Complete (defined).'
                    : 'Not a complete channel here.'
                  : undefined
              }
            />
          </Panel>
        );
      }
      break;
    }
    case 'center': {
      const center = CENTERS[value as CenterName];
      if (center) {
        const state = chart
          ? chart.definedCenters.includes(value as CenterName)
            ? 'Defined in this chart.'
            : 'Open in this chart.'
          : undefined;
        return (
          <Panel eyebrow="Center" title={center.title} lead={center.function}>
            <Fact label="Theme" text={center.theme} />
            <Fact label="When defined" text={center.defined} />
            <Fact label="When open" text={center.open} />
            <Fact label="Question to ask" text={center.question} />
            <Fact label="In this chart" text={state} />
          </Panel>
        );
      }
      break;
    }
    case 'type': {
      const type = TYPES[value as ChartType];
      if (type) {
        return (
          <Panel eyebrow="Type" title={value} lead={type.tagline}>
            <Fact label="Overview" text={type.summary} />
            <Fact label="Strategy" text={type.strategy} />
            <Fact label="Not-self theme" text={type.notSelfTheme} />
            <Fact label="Signature" text={type.signature} />
            <Fact label="Aura" text={type.aura} />
            <Fact label="Sharing" text={type.share} />
            {type.advice.length ? (
              <div class="fact">
                <dt>Advice</dt>
                <dd>
                  <ul>
                    {type.advice.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                </dd>
              </div>
            ) : null}
          </Panel>
        );
      }
      break;
    }
    case 'authority': {
      const authority = AUTHORITIES[value as AuthorityName];
      if (authority) {
        return (
          <Panel eyebrow="Authority" title={authority.title} lead={authority.summary}>
            <Fact label="How to use it" text={authority.howToUse} />
          </Panel>
        );
      }
      break;
    }
    case 'profile': {
      const profile = PROFILES[value];
      if (profile)
        return (
          <Panel eyebrow="Profile" title={`${value} · ${profile.name}`} lead={profile.summary} />
        );
      break;
    }
    case 'definition': {
      const definition = DEFINITIONS[value as DefinitionName];
      if (definition)
        return <Panel eyebrow="Definition" title={definition.title} lead={definition.summary} />;
      break;
    }
    case 'planet': {
      const planet = PLANETS[value as PlanetName];
      if (planet)
        return (
          <Panel eyebrow="Planet" title={`${planet.glyph} ${planet.label}`} lead={planet.meaning} />
        );
      break;
    }
    case 'dynamic': {
      const dynamic = DYNAMICS[value as DynamicKind];
      if (dynamic) {
        return (
          <Panel eyebrow="Dynamic" title={dynamic.title} lead={dynamic.summary}>
            <Fact label="Example" text={dynamic.example} />
          </Panel>
        );
      }
      break;
    }
    case 'term': {
      const entry = GLOSSARY.find((g) => g.term === value);
      if (entry) return <Panel eyebrow="Glossary" title={entry.term} lead={entry.definition} />;
      break;
    }
    default:
      break;
  }
  const tip = tipFor(key);
  if (tip) return <Panel eyebrow="Note" title={tip.title} lead={tip.body} />;
  return (
    <p class="empty-hint">
      No further detail for {kind === 'center' ? centerLabel(value as CenterName) : key}.
    </p>
  );
}
