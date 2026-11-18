import type { BirthInput } from '@/types';

const MS_PER_HOUR = 3_600_000;

/** Parses `YYYY-MM-DD` and `HH:MM` into the ms of that wall clock read as UTC. */
function wallClockMs(date: string, time: string): number {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const t = /^(\d{2}):(\d{2})$/.exec(time);
  if (!d || !t) throw new Error(`Invalid date/time: ${date} ${time}`);
  return Date.UTC(Number(d[1]), Number(d[2]) - 1, Number(d[3]), Number(t[1]), Number(t[2]));
}

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  const cached = formatters.get(timeZone);
  if (cached) return cached;
  const created = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  });
  formatters.set(timeZone, created);
  return created;
}

/** Offset (hours) of a zone at an absolute instant, read off the zone's own wall clock. */
function offsetAtInstant(timeZone: string, instantMs: number): number {
  const parts = formatterFor(timeZone).formatToParts(new Date(instantMs));
  const get = (type: string): number => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour'),
    get('minute'),
    get('second'),
  );
  return (asUtc - Math.floor(instantMs / 1000) * 1000) / MS_PER_HOUR;
}

/**
 * UTC offset in hours of an IANA time zone for a LOCAL date (`YYYY-MM-DD`)
 * and time (`HH:MM`), with daylight saving time applied (e.g. Lisbon is 1 in
 * summer and 0 in winter; Kolkata 5.5; Kathmandu 5.75). The local time is
 * resolved to an instant by iterating, so times near a DST change pick the
 * offset valid at the resulting instant.
 *
 * @throws Error when the zone name is unknown or the date/time is malformed.
 */
export function utcOffsetForZone(timeZone: string, date: string, time: string): number {
  const local = wallClockMs(date, time);
  try {
    let offset = offsetAtInstant(timeZone, local);
    for (let i = 0; i < 2; i++) offset = offsetAtInstant(timeZone, local - offset * MS_PER_HOUR);
    return offset;
  } catch (error) {
    if (error instanceof RangeError) {
      throw new Error(`Unknown time zone: ${timeZone}`, { cause: error });
    }
    throw error;
  }
}

/**
 * The birth moment as an absolute instant: the local wall clock minus the
 * UTC offset.
 */
export function birthToUtcDate(input: BirthInput): Date {
  return new Date(wallClockMs(input.date, input.time) - input.utcOffset * MS_PER_HOUR);
}
