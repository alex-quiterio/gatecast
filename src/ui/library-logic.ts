import { CENTER_GATES } from '@engine';
import { AUTHORITIES, CENTERS, CHANNELS, GATES, GLOSSARY, PROFILES, TYPES } from '@content';
import { CENTER_NAMES, type CenterName } from '@/types';
import type { LibraryTab } from './router';
import { centerLabel } from './views/common';

/** One row of the library (and of the quick-find index). */
export interface LibraryEntry {
  id: string;
  title: string;
  subtitle: string;
  /** Lower-case haystack for search. */
  haystack: string;
  /** Tooltip / detail key, e.g. `gate:20`. */
  tip: string;
  center?: CenterName;
}

/** Human labels of the library tabs. */
export const TAB_LABELS: Record<LibraryTab, string> = {
  gate: 'Gates',
  channel: 'Channels',
  center: 'Centers',
  type: 'Types',
  authority: 'Authorities',
  profile: 'Profiles',
  glossary: 'Glossary',
};

function centerOfGateNumber(gate: number): CenterName | undefined {
  return CENTER_NAMES.find((c) => CENTER_GATES[c]?.includes(gate));
}

/** All entries of one library tab, in display order. */
export function entriesFor(tab: LibraryTab): LibraryEntry[] {
  switch (tab) {
    case 'gate':
      return Object.values(GATES)
        .sort((a, b) => a.number - b.number)
        .map((g) => {
          const center = centerOfGateNumber(g.number);
          return {
            id: String(g.number),
            title: `${g.number}. ${g.name}`,
            subtitle: g.keynote,
            haystack: `${g.number} ${g.name} ${g.keynote} ${g.iching}`.toLowerCase(),
            tip: `gate:${g.number}`,
            ...(center ? { center } : {}),
          };
        });
    case 'channel':
      return Object.entries(CHANNELS)
        .sort(([a], [b]) => Number(a.split('-')[0]) - Number(b.split('-')[0]) || a.localeCompare(b))
        .map(([id, c]) => ({
          id,
          title: `${id} ${c.name}`,
          subtitle: [c.circuit, c.stream].filter(Boolean).join(' · '),
          haystack: `${id} ${c.name} ${c.circuit ?? ''} ${c.stream ?? ''}`.toLowerCase(),
          tip: `channel:${id}`,
        }));
    case 'center':
      return CENTER_NAMES.map((c) => ({
        id: c,
        title: CENTERS[c]?.title ?? centerLabel(c),
        subtitle: CENTERS[c]?.theme ?? '',
        haystack: `${c} ${CENTERS[c]?.title ?? ''} ${CENTERS[c]?.theme ?? ''}`.toLowerCase(),
        tip: `center:${c}`,
      }));
    case 'type':
      return Object.entries(TYPES).map(([id, t]) => ({
        id,
        title: id,
        subtitle: t.tagline,
        haystack: `${id} ${t.tagline} ${t.strategy}`.toLowerCase(),
        tip: `type:${id}`,
      }));
    case 'authority':
      return Object.entries(AUTHORITIES).map(([id, a]) => ({
        id,
        title: a.title,
        subtitle: id,
        haystack: `${id} ${a.title} ${a.summary}`.toLowerCase(),
        tip: `authority:${id}`,
      }));
    case 'profile':
      return Object.entries(PROFILES).map(([id, p]) => ({
        id,
        title: `${id} · ${p.name}`,
        subtitle: '',
        haystack: `${id} ${p.name} ${p.summary}`.toLowerCase(),
        tip: `profile:${id}`,
      }));
    case 'glossary':
      return GLOSSARY.map((g) => ({
        id: g.term,
        title: g.term,
        subtitle: '',
        haystack: `${g.term} ${g.definition}`.toLowerCase(),
        tip: `term:${g.term}`,
      }));
  }
}

/**
 * Filter entries by a free-text query and, for gates, by center.
 *
 * @param entries Entries of one tab.
 * @param tab The tab the entries belong to (the center filter applies to gates only).
 * @param query Free text, matched case-insensitively against the haystack.
 * @param center Optional center filter.
 */
export function filterEntries(
  entries: readonly LibraryEntry[],
  tab: LibraryTab,
  query: string,
  center: CenterName | '' = '',
): LibraryEntry[] {
  const q = query.trim().toLowerCase();
  return entries.filter(
    (e) => (!q || e.haystack.includes(q)) && (!center || tab !== 'gate' || e.center === center),
  );
}
