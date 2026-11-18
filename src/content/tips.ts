import { CENTER_NAMES, PLANET_NAMES } from '@/types';
import type { AuthorityName, ChartType, DefinitionName, DynamicKind } from '@/types';
import { AUTHORITIES } from './authorities';
import { CENTERS } from './centers';
import { CHANNELS } from './channels';
import { CIRCUITS, CIRCUIT_ORDER, STREAMS, STREAM_ORDER } from './circuits';
import { CROSS_ANGLES, QUARTERS } from './crosses';
import { lineMeaning } from './gate-lines';
import { TYPES } from './chart-types';
import { DEFINITIONS } from './definitions';
import { DYNAMICS } from './dynamics';
import { GATES } from './gates';
import { GLOSSARY } from './glossary';
import { LINES } from './lines';
import { PLANETS } from './planets';
import { PROFILES } from './profiles';
import type { Tip } from './schema';
import type { Circuit, CrossAngle, Quarter, Stream } from './schema';

/** Longest allowed tooltip body, in characters. */
export const TIP_BODY_MAX = 220;

/** A tooltip key split into its family (`gate`, `channel`, ...) and id. */
export interface TipKey {
  readonly family: string;
  readonly id: string;
}

/**
 * Split a tooltip key such as `gate:20` at its first colon.
 * @returns undefined when there is no family or no id.
 */
export function parseTipKey(key: string): TipKey | undefined {
  const i = key.indexOf(':');
  if (i <= 0 || i === key.length - 1) return undefined;
  return { family: key.slice(0, i), id: key.slice(i + 1).trim() };
}

/** Shorten text to `max` characters, preferring whole sentences, then whole words. */
function clip(text: string, max: number = TIP_BODY_MAX): string {
  if (text.length <= max) return text;
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [];
  let out = '';
  for (const s of sentences) {
    if ((out + s).trim().length > max) break;
    out += s;
  }
  if (out.trim().length > 0) return out.trim();
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.]+$/, '')}…`;
}

/** Case-insensitive lookup of `id` among `names`, ignoring spaces. */
function match<T extends string>(names: readonly T[], id: string): T | undefined {
  const norm = (s: string): string => s.replace(/\s+/g, '').toLowerCase();
  const wanted = norm(id);
  return names.find((n) => norm(n) === wanted);
}

function lookup(family: string, id: string): Tip | undefined {
  switch (family) {
    case 'gate': {
      const gate = /^\d+$/.test(id) ? GATES[Number(id)] : undefined;
      return (
        gate && {
          title: `Gate ${gate.number} · ${gate.name}`,
          body: clip(`${gate.keynote}. ${gate.summary}`),
        }
      );
    }
    case 'channel': {
      const ch = CHANNELS[id];
      if (!ch) return undefined;
      const circuit = ch.stream ? `${ch.circuit} (${ch.stream})` : ch.circuit;
      return {
        title: `Channel ${id} · ${ch.name}`,
        body: clip(`${circuit} circuit. ${ch.summary}`),
      };
    }
    case 'center': {
      const name = match(CENTER_NAMES, id);
      const c = name && CENTERS[name];
      return (
        c && {
          title: `${c.title} center`,
          body: clip(`${c.function} When open, it often asks: ${c.question}`),
        }
      );
    }
    case 'planet': {
      const name = match(PLANET_NAMES, id);
      const p = name && PLANETS[name];
      return p && { title: `${p.glyph} ${p.label}`, body: clip(p.meaning) };
    }
    case 'type': {
      const name = match(Object.keys(TYPES) as ChartType[], id);
      const t = name && TYPES[name];
      return (
        t && {
          title: name,
          body: clip(`${t.tagline}. Strategy: ${t.strategy}. Not-self: ${t.notSelfTheme}.`),
        }
      );
    }
    case 'authority': {
      const name = match(Object.keys(AUTHORITIES) as AuthorityName[], id);
      const a = name && AUTHORITIES[name];
      return a && { title: a.title, body: clip(a.summary) };
    }
    case 'profile': {
      const p = PROFILES[id];
      return p && { title: `Profile ${id} · ${p.name}`, body: clip(p.summary) };
    }
    case 'line': {
      const n = /^[1-6]$/.test(id) ? Number(id) : 0;
      const l =
        n === 1 || n === 2 || n === 3 || n === 4 || n === 5 || n === 6 ? LINES[n] : undefined;
      return l && { title: `Line ${id} · ${l.name}`, body: clip(l.summary) };
    }
    case 'definition': {
      const name = match(Object.keys(DEFINITIONS) as DefinitionName[], id);
      const d = name && DEFINITIONS[name];
      return d && { title: d.title, body: clip(d.summary) };
    }
    case 'dynamic': {
      const name = match(Object.keys(DYNAMICS) as DynamicKind[], id);
      const d = name && DYNAMICS[name];
      return d && { title: d.title, body: clip(d.summary) };
    }
    case 'circuit': {
      const name = match<Circuit>(CIRCUIT_ORDER, id);
      const c = name && CIRCUITS[name];
      return c && { title: `${c.title} circuit`, body: clip(`${c.tagline}. ${c.summary}`) };
    }
    case 'stream': {
      const name = match<Stream>(STREAM_ORDER, id);
      const s = name && STREAMS[name];
      return s && { title: `${s.title} stream`, body: clip(s.summary) };
    }
    case 'cross': {
      const name = match(Object.keys(CROSS_ANGLES) as CrossAngle[], id);
      const a = name && CROSS_ANGLES[name];
      return a && { title: `${a.title} Cross`, body: clip(a.summary) };
    }
    case 'quarter': {
      const name = match(Object.keys(QUARTERS) as Quarter[], id);
      const q = name && QUARTERS[name];
      return q && { title: q.title, body: clip(`${q.theme}. ${q.summary}`) };
    }
    case 'gateline': {
      const m = /^(\d+)\.(\d)$/.exec(id);
      if (!m) return undefined;
      const gate = GATES[Number(m[1])];
      const line = lineMeaning(Number(m[1]), Number(m[2]));
      return (
        gate &&
        line && {
          title: `Gate ${m[1]}.${m[2]} · ${gate.name}: ${line.title}`,
          body: clip(line.summary),
        }
      );
    }
    case 'term': {
      const wanted = id.toLowerCase();
      const entry = GLOSSARY.find((g) => g.term.toLowerCase() === wanted);
      return entry && { title: entry.term, body: clip(entry.definition) };
    }
    default:
      return undefined;
  }
}

/**
 * Resolve a tooltip key to a short title and plain-text body (at most
 * `TIP_BODY_MAX` characters). Families: `gate:20`, `channel:20-34`,
 * `center:Throat`, `planet:Sun`, `type:Generator`, `authority:Sacral`,
 * `profile:5/1`, `line:3`, `definition:Split Definition`,
 * `dynamic:electromagnetic`, `term:Strategy`, `circuit:Tribal`, `stream:Ego`,
 * `cross:Right Angle`, `quarter:Initiation` and `gateline:36.6`.
 * @returns undefined for an unknown family or id.
 */
export function tipFor(key: string): Tip | undefined {
  const parsed = parseTipKey(key);
  return parsed ? lookup(parsed.family, parsed.id) : undefined;
}
