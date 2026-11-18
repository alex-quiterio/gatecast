import { GATES, STREAMS, STREAM_ORDER, lineMeaning } from '@content';
import { TAB_LABELS, entriesFor } from './library-logic';
import { LIBRARY_TABS, buildHash } from './router';
import type { SavedPerson } from './storage';
import { describeBirth } from './views/common';

/** One thing the quick-find palette can jump to. */
export interface QuickItem {
  /** Group heading, e.g. `Gates` or `Saved charts`. */
  group: string;
  label: string;
  hint: string;
  /** Destination hash. */
  hash: string;
  haystack: string;
}

const PAGES: { label: string; hash: string }[] = [
  { label: 'Chart', hash: '#/' },
  { label: 'Compare', hash: '#/compare' },
  { label: 'Library', hash: '#/library' },
  { label: 'About', hash: '#/about' },
];

/** Every line of every gate that has a meaning: `36.6 · Title`, jumping to the gate with that line open. */
function lineItems(): QuickItem[] {
  const items: QuickItem[] = [];
  for (const gate of Object.values(GATES).sort((a, b) => a.number - b.number)) {
    for (let line = 1; line <= 6; line++) {
      const meaning = lineMeaning(gate.number, line);
      if (!meaning) continue;
      items.push({
        group: 'Gate lines',
        label: `${gate.number}.${line} · ${meaning.title}`,
        hint: `Gate ${gate.number} ${gate.name}, line ${line}`,
        hash: buildHash({ name: 'library', tab: 'gate', id: String(gate.number), line }),
        haystack:
          `${gate.number}.${line} ${gate.number} ${line} line ${gate.name} ${meaning.summary}`.toLowerCase(),
      });
    }
  }
  return items;
}

let libraryItems: QuickItem[] | undefined;

function libraryIndex(): QuickItem[] {
  if (libraryItems) return libraryItems;
  const items: QuickItem[] = [];
  for (const tab of LIBRARY_TABS) {
    for (const e of entriesFor(tab)) {
      items.push({
        group: TAB_LABELS[tab],
        label: e.title,
        hint: e.subtitle,
        hash: buildHash({ name: 'library', tab, id: e.id }),
        haystack: e.haystack,
      });
    }
  }
  for (const stream of STREAM_ORDER) {
    const content = STREAMS[stream];
    items.push({
      group: 'Streams',
      label: `${content.title} stream`,
      hint: `${content.circuit} circuit`,
      hash: buildHash({ name: 'library', tab: 'circuit', id: content.circuit }),
      haystack: `${stream} stream ${content.circuit} circuit ${content.summary}`.toLowerCase(),
    });
  }
  items.push(...lineItems());
  libraryItems = items;
  return items;
}

/** Everything searchable: pages, saved people and the whole library. */
export function buildQuickItems(people: readonly SavedPerson[]): QuickItem[] {
  return [
    ...PAGES.map((p) => ({
      group: 'Go to',
      label: p.label,
      hint: '',
      hash: p.hash,
      haystack: p.label.toLowerCase(),
    })),
    ...people.map((p) => ({
      group: 'Saved charts',
      label: p.input.name || 'Unnamed',
      hint: describeBirth(p.input),
      hash: buildHash({ name: 'chart', person: p.input }),
      haystack: `${p.input.name} ${p.input.date} ${p.input.place ?? ''}`.toLowerCase(),
    })),
    ...libraryIndex(),
  ];
}

/**
 * Rank items for a query: label prefix beats label substring beats haystack
 * substring; every word must match. An empty query returns the first `limit`
 * items of the pages and saved groups only.
 */
export function searchItems(items: readonly QuickItem[], query: string, limit = 30): QuickItem[] {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return items.filter((i) => i.group === 'Go to' || i.group === 'Saved charts').slice(0, limit);
  }
  const scored: { item: QuickItem; score: number }[] = [];
  for (const item of items) {
    const label = item.label.toLowerCase();
    let score = 0;
    let ok = true;
    for (const w of words) {
      if (label.startsWith(w) || label.split(/[\s.]+/).some((t) => t.startsWith(w))) score += 3;
      else if (label.includes(w)) score += 2;
      else if (item.haystack.includes(w)) score += 1;
      else {
        ok = false;
        break;
      }
    }
    if (ok) scored.push({ item, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.item);
}
