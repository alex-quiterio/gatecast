const FALLBACK_ZONES = [
  'UTC',
  'Africa/Cairo',
  'Africa/Johannesburg',
  'America/Los_Angeles',
  'America/New_York',
  'America/Sao_Paulo',
  'Asia/Kolkata',
  'Asia/Tokyo',
  'Atlantic/Reykjavik',
  'Australia/Sydney',
  'Europe/Lisbon',
  'Europe/London',
  'Europe/Rome',
  'Indian/Maldives',
  'Pacific/Auckland',
];

/** Display order of region groups; anything else is appended alphabetically. */
export const ZONE_REGIONS = [
  'Africa',
  'America',
  'Antarctica',
  'Asia',
  'Atlantic',
  'Australia',
  'Europe',
  'Indian',
  'Pacific',
  'UTC / Etc',
] as const;

/** All IANA zones the browser knows (sorted), with a short fallback list. */
export function listTimeZones(): string[] {
  try {
    const intl = Intl as unknown as { supportedValuesOf?: (key: string) => string[] };
    const zones = intl.supportedValuesOf?.('timeZone');
    if (zones && zones.length > 0) {
      return [...new Set(zones.includes('UTC') ? zones : [...zones, 'UTC'])].sort();
    }
  } catch {
    /* fall through to the fallback list */
  }
  return [...FALLBACK_ZONES].sort();
}

/** Region label for one zone: `Europe/Rome` is `Europe`; `UTC`, `Etc/GMT+1` are `UTC / Etc`. */
export function zoneRegion(zone: string): string {
  const head = zone.split('/')[0] ?? zone;
  if (!zone.includes('/') || head === 'Etc' || head === 'UTC') return 'UTC / Etc';
  return head;
}

/** Group zones by region for a native `<select>`, in a stable region order. */
export function groupTimeZones(zones: readonly string[]): Record<string, string[]> {
  const buckets = new Map<string, string[]>();
  for (const zone of zones) {
    const region = zoneRegion(zone);
    const list = buckets.get(region);
    if (list) list.push(zone);
    else buckets.set(region, [zone]);
  }
  const known: readonly string[] = ZONE_REGIONS;
  const extra = [...buckets.keys()].filter((k) => !known.includes(k)).sort();
  const out: Record<string, string[]> = {};
  for (const region of [...known, ...extra]) {
    const list = buckets.get(region);
    if (list) out[region] = [...list].sort();
  }
  return out;
}
