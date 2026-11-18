/**
 * Build public/places.json from GeoNames (cities with population >= 15,000).
 *
 * Usage: `bun scripts/build-places.ts`
 *
 * City data © GeoNames, CC BY 4.0, https://www.geonames.org
 * Output format (version 1):
 *   { v, countries: [[code, name]], zones: [iana], admins: [name], rows: Row[] }
 *   Row = [name, asciiIfDifferent, countryIdx, zoneIdx, population (3 significant digits),
 *          adminIdx (1-based into admins, 0 = none), "alt|alt"]
 */
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { normalize } from '@/places/normalize';
import { parsePlaces, searchPlaces, type PlacesFile } from '@/places';
import { FEATURED, FEATURED_ALTERNATES } from '@/places/featured';

const BASE = 'https://download.geonames.org/export/dump/';
const OUT = join(import.meta.dir, '..', 'public', 'places.json');
const MAX_ALTERNATE_LENGTH = 18;

/** Larger cities get more alternates: that is where "Venezia" or "Bombay" is typed. */
function alternateBudget(pop: number): number {
  if (pop >= 100_000) return 6;
  if (pop >= 40_000) return 2;
  return 1;
}

/** Skip codes (CCU), lowercase transliterations and "A - B" compounds. */
function plausibleAlternate(alt: string): boolean {
  return (
    alt.length >= 4 &&
    alt.length <= MAX_ALTERNATE_LENGTH &&
    LATIN.test(alt) &&
    /^\p{Lu}/u.test(alt) &&
    alt !== alt.toUpperCase() &&
    !alt.includes(' - ')
  );
}
const LATIN = /^[\p{Script=Latin}][\p{Script=Latin}\p{M} '.-]*$/u;

async function download(dir: string, file: string): Promise<string> {
  const res = await fetch(BASE + file);
  if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`);
  const path = join(dir, file);
  await Bun.write(path, res);
  return path;
}

async function unzipText(zip: string, member: string): Promise<string> {
  const proc = Bun.spawn(['unzip', '-p', zip, member], { stdout: 'pipe' });
  const text = await new Response(proc.stdout).text();
  if ((await proc.exited) !== 0) throw new Error(`unzip failed for ${zip}`);
  return text;
}

function col(cols: string[], i: number): string {
  return cols[i] ?? '';
}

type Row = [string, string, number, number, number, number, string];

function roundPop(n: number): number {
  if (n < 1000) return n;
  const mag = 10 ** (Math.floor(Math.log10(n)) - 2);
  return Math.round(n / mag) * mag;
}

/** Fail the build if a must-find city is missing or resolves to the wrong place. */
function checkMustFind(file: PlacesFile): void {
  const index = parsePlaces(file);
  const must: [string, string, string][] = [
    ['venice', 'Italy', 'Europe/Rome'],
    ['venezia', 'Italy', 'Europe/Rome'],
    ['forli', 'Italy', 'Europe/Rome'],
    ['Forlì', 'Italy', 'Europe/Rome'],
    ['amsterdam', 'Netherlands', 'Europe/Amsterdam'],
    ['amsterdam netherlands', 'Netherlands', 'Europe/Amsterdam'],
    ['rome', 'Italy', 'Europe/Rome'],
    ['milan', 'Italy', 'Europe/Rome'],
    ['lisbon', 'Portugal', 'Europe/Lisbon'],
    ['porto', 'Portugal', 'Europe/Lisbon'],
    ['sao paulo', 'Brazil', 'America/Sao_Paulo'],
    ['zurich', 'Switzerland', 'Europe/Zurich'],
    ['mumbai', 'India', 'Asia/Kolkata'],
    ['bombay', 'India', 'Asia/Kolkata'],
    ['kolkata', 'India', 'Asia/Kolkata'],
    ['kathmandu', 'Nepal', 'Asia/Kathmandu'],
    ['auckland', 'New Zealand', 'Pacific/Auckland'],
    ['reykjavik', 'Iceland', 'Atlantic/Reykjavik'],
  ];
  for (const [query, country, zone] of must) {
    const top = searchPlaces(index, query, 1)[0];
    if (!top || top.country !== country || top.timeZone !== zone) {
      throw new Error(`Sanity check failed for "${query}": got ${JSON.stringify(top)}`);
    }
  }
}

async function main(): Promise<void> {
  const dir = await mkdtemp(join(tmpdir(), 'gatecast-geonames-'));
  try {
    const [zip, countryFile, adminFile] = await Promise.all([
      download(dir, 'cities15000.zip'),
      download(dir, 'countryInfo.txt'),
      download(dir, 'admin1CodesASCII.txt'),
    ]);
    const countryNames = new Map<string, string>();
    for (const line of (await Bun.file(countryFile).text()).split('\n')) {
      if (!line || line.startsWith('#')) continue;
      const c = line.split('\t');
      countryNames.set(col(c, 0), col(c, 4).replace(/^The /, ''));
    }
    const adminNames = new Map<string, string>();
    for (const line of (await Bun.file(adminFile).text()).split('\n')) {
      if (!line) continue;
      const c = line.split('\t');
      adminNames.set(col(c, 0), col(c, 2) || col(c, 1));
    }

    const countries: [string, string][] = [];
    const countryIdx = new Map<string, number>();
    const zones: string[] = [];
    const zoneIdx = new Map<string, number>();
    const intern = <T>(map: Map<string, number>, list: T[], key: string, value: T): number => {
      const have = map.get(key);
      if (have !== undefined) return have;
      list.push(value);
      map.set(key, list.length - 1);
      return list.length - 1;
    };

    interface Raw {
      name: string;
      ascii: string;
      alternates: string;
      cc: string;
      admin: string;
      pop: number;
      tz: string;
      id: string;
    }
    const raws: Raw[] = [];
    for (const line of (await unzipText(zip, 'cities15000.txt')).split('\n')) {
      if (!line) continue;
      const c = line.split('\t');
      raws.push({
        id: col(c, 0),
        name: col(c, 1),
        ascii: col(c, 2),
        alternates: col(c, 3),
        cc: col(c, 8),
        admin: adminNames.get(`${col(c, 8)}.${col(c, 10)}`) ?? '',
        pop: Number(col(c, 14)) || 0,
        tz: col(c, 17),
      });
    }
    for (const f of FEATURED) {
      if (!raws.some((r) => normalize(r.name) === normalize(f.name) && r.cc === f.countryCode)) {
        raws.push({
          id: `featured-${f.name}`,
          name: f.name,
          ascii: '',
          alternates: (f.alternates ?? []).join(','),
          cc: f.countryCode,
          admin: f.admin ?? '',
          pop: f.population,
          tz: f.timeZone,
        });
      }
    }
    raws.sort((a, b) => b.pop - a.pop || a.name.localeCompare(b.name) || a.id.localeCompare(b.id));

    const admins: string[] = [];
    const adminIdx = new Map<string, number>();
    const rows: Row[] = [];
    for (const r of raws) {
      if (!r.tz) continue;
      const nameFold = normalize(r.name);
      const asciiFold = normalize(r.ascii);
      const seen = new Set([nameFold, asciiFold]);
      const alts: string[] = [];
      for (const alt of r.alternates.split(',')) {
        if (!plausibleAlternate(alt)) continue;
        const fold = normalize(alt);
        if (fold.length < 3 || seen.has(fold)) continue;
        seen.add(fold);
        alts.push(alt);
      }
      alts.sort((a, b) => a.length - b.length || a.localeCompare(b));
      const curated = (FEATURED_ALTERNATES[`${r.name}|${r.cc}`] ?? []).filter(
        (a) => !seen.has(normalize(a)) || alts.some((x) => normalize(x) === normalize(a)),
      );
      for (const a of curated) {
        const idx = alts.findIndex((x) => normalize(x) === normalize(a));
        if (idx >= 0) alts.splice(idx, 1);
      }
      alts.unshift(...curated);
      const cc = countryIdx.get(r.cc);
      const ccIdx =
        cc ?? intern(countryIdx, countries, r.cc, [r.cc, countryNames.get(r.cc) ?? r.cc]);
      const tzIdx = intern(zoneIdx, zones, r.tz, r.tz);
      rows.push([
        r.name,
        asciiFold === nameFold || r.ascii === r.name ? '' : r.ascii,
        ccIdx,
        tzIdx,
        roundPop(r.pop),
        r.admin ? intern(adminIdx, admins, r.admin, r.admin) + 1 : 0,
        alts.slice(0, alternateBudget(r.pop)).join('|'),
      ]);
    }

    for (const z of zones) {
      try {
        new Intl.DateTimeFormat('en', { timeZone: z });
      } catch {
        throw new Error(`Invalid IANA zone in output: ${z}`);
      }
    }

    const file: PlacesFile = { v: 1, countries, zones, admins, rows };
    checkMustFind(file);
    const json = JSON.stringify(file);
    await Bun.write(OUT, json + '\n');
    const gz = gzipSync(json, { level: 9 }).length;
    console.warn(
      `rows=${rows.length} countries=${countries.length} zones=${zones.length} ` +
        `raw=${(json.length / 1024).toFixed(0)} KiB gzip=${(gz / 1024).toFixed(0)} KiB`,
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

await main();
