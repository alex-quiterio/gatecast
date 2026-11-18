import type { CenterName, Chart, ChartType, PlanetName } from '@/types';
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
import type { AuthorityName, DefinitionName, DynamicKind } from '@/types';
import { h, type Child } from '@ui/dom';
import { centerLabel } from './common';

function fact(label: string, text: string | undefined): Child {
  if (!text) return null;
  return h('div', { class: 'fact' }, h('dt', null, label), h('dd', null, text));
}

function panel(
  eyebrow: string,
  title: string,
  lead: string | undefined,
  ...facts: Child[]
): HTMLElement {
  return h(
    'article',
    { class: 'detail-body' },
    h('p', { class: 'eyebrow' }, eyebrow),
    h('h3', null, title),
    lead ? h('p', { class: 'lead' }, lead) : null,
    h('dl', { class: 'facts' }, facts),
  );
}

/** Placeholder shown before anything is selected. */
export function emptyDetail(): HTMLElement {
  return h(
    'p',
    { class: 'muted' },
    'Select a gate, channel or center on the chart, or any highlighted term, to read its full explanation here.',
  );
}

/**
 * Full explanation for a tooltip key (`gate:20`, `center:Throat`, ...), built
 * from the content module. Unknown keys fall back to the tooltip text.
 *
 * @param key Same keys as `tipFor`.
 * @param chart Optional chart, to show how the item appears in it.
 */
export function detailFor(key: string, chart?: Chart): HTMLElement {
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
        return panel(
          `Gate ${gate.number} · ${gate.iching}`,
          gate.name,
          gate.keynote,
          fact('In depth', gate.summary),
          fact('When defined', gate.whenDefined),
          fact('In this chart', where),
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
        return panel(
          `Channel ${value}`,
          channel.name,
          channel.summary,
          fact('Circuit', channel.circuit),
          fact('Stream', channel.stream),
          fact('Gates', both.filter(Boolean).join(' + ')),
          fact(
            'In this chart',
            chart ? (complete ? 'Complete (defined).' : 'Not a complete channel here.') : undefined,
          ),
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
        return panel(
          'Center',
          center.title,
          center.function,
          fact('Theme', center.theme),
          fact('When defined', center.defined),
          fact('When open', center.open),
          fact('Question to ask', center.question),
          fact('In this chart', state),
        );
      }
      break;
    }
    case 'type': {
      const type = TYPES[value as ChartType];
      if (type) {
        return panel(
          'Type',
          value,
          type.tagline,
          fact('Overview', type.summary),
          fact('Strategy', type.strategy),
          fact('Not-self theme', type.notSelfTheme),
          fact('Signature', type.signature),
          fact('Aura', type.aura),
          fact('Sharing', type.share),
          type.advice.length
            ? h(
                'div',
                { class: 'fact' },
                h('dt', null, 'Advice'),
                h(
                  'dd',
                  null,
                  h(
                    'ul',
                    null,
                    type.advice.map((a) => h('li', null, a)),
                  ),
                ),
              )
            : null,
        );
      }
      break;
    }
    case 'authority': {
      const authority = AUTHORITIES[value as AuthorityName];
      if (authority)
        return panel(
          'Authority',
          authority.title,
          authority.summary,
          fact('How to use it', authority.howToUse),
        );
      break;
    }
    case 'profile': {
      const profile = PROFILES[value];
      if (profile) return panel('Profile', `${value} · ${profile.name}`, profile.summary);
      break;
    }
    case 'definition': {
      const definition = DEFINITIONS[value as DefinitionName];
      if (definition) return panel('Definition', definition.title, definition.summary);
      break;
    }
    case 'planet': {
      const planet = PLANETS[value as PlanetName];
      if (planet) return panel('Planet', `${planet.glyph} ${planet.label}`, planet.meaning);
      break;
    }
    case 'dynamic': {
      const dynamic = DYNAMICS[value as DynamicKind];
      if (dynamic)
        return panel('Dynamic', dynamic.title, dynamic.summary, fact('Example', dynamic.example));
      break;
    }
    case 'term': {
      const entry = GLOSSARY.find((g) => g.term === value);
      if (entry) return panel('Glossary', entry.term, entry.definition);
      break;
    }
    default:
      break;
  }
  const tip = tipFor(key);
  if (tip) return panel('Note', tip.title, tip.body);
  return h(
    'p',
    { class: 'muted' },
    `No further detail for ${kind === 'center' ? centerLabel(value as CenterName) : key}.`,
  );
}
