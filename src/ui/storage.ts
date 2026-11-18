import type { BirthInput } from '@/types';
import { decodePerson, encodePerson } from './share';

/** The slice of the Web Storage API the app needs (so tests can fake it). */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const PEOPLE_KEY = 'hd:v1:people';
export const THEME_KEY = 'hd:v1:theme';
export const MAX_PEOPLE = 50;

/** A saved birth record. Only inputs are stored, never computed charts. */
export interface SavedPerson {
  id: string;
  input: BirthInput;
  savedAt: string;
}

export type AddResult = { ok: true; person: SavedPerson } | { ok: false; reason: string };

/** Best-effort access to `window.localStorage`; `undefined` when blocked. */
export function browserStorage(): StorageLike | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function personId(input: BirthInput): string {
  return encodePerson(input);
}

function parsePeople(raw: string | null): SavedPerson[] {
  if (!raw) return [];
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];
  const seen = new Set<string>();
  const people: SavedPerson[] = [];
  for (const item of data as unknown[]) {
    if (typeof item !== 'object' || item === null) continue;
    const record = item as Record<string, unknown>;
    const candidate = record['input'];
    if (typeof candidate !== 'object' || candidate === null) continue;
    const c = candidate as Record<string, unknown>;
    if (
      typeof c['date'] !== 'string' ||
      typeof c['time'] !== 'string' ||
      typeof c['utcOffset'] !== 'number'
    ) {
      continue;
    }
    const params = new URLSearchParams();
    params.set('n', typeof c['name'] === 'string' ? c['name'] : '');
    params.set('d', c['date']);
    params.set('t', c['time']);
    params.set('u', String(c['utcOffset']));
    if (typeof c['timeZone'] === 'string') params.set('z', c['timeZone']);
    const input = decodePerson(params);
    if (!input) continue;
    const id = personId(input);
    if (seen.has(id)) continue;
    seen.add(id);
    const savedAt = typeof record['savedAt'] === 'string' ? record['savedAt'] : '';
    people.push({ id, input, savedAt });
    if (people.length >= MAX_PEOPLE) break;
  }
  return people;
}

/** Saved people, backed by any `StorageLike`; never throws. */
export class PeopleStore {
  constructor(
    private readonly storage: StorageLike | undefined,
    private readonly key: string = PEOPLE_KEY,
  ) {}

  /** All valid saved people, newest first. Corrupt data reads as empty. */
  list(): SavedPerson[] {
    try {
      return parsePeople(this.storage?.getItem(this.key) ?? null);
    } catch {
      return [];
    }
  }

  private write(people: SavedPerson[]): boolean {
    if (!this.storage) return false;
    try {
      this.storage.setItem(this.key, JSON.stringify(people));
      return true;
    } catch {
      return false;
    }
  }

  /** Save (or move to the top) a person. Fails when full or storage is unavailable. */
  add(input: BirthInput, now: Date = new Date()): AddResult {
    const id = personId(input);
    const existing = this.list().filter((p) => p.id !== id);
    if (existing.length >= MAX_PEOPLE) {
      return { ok: false, reason: `You can save up to ${MAX_PEOPLE} people. Delete one first.` };
    }
    const person: SavedPerson = { id, input, savedAt: now.toISOString() };
    if (!this.write([person, ...existing])) {
      return { ok: false, reason: 'Your browser did not allow saving. Storage may be disabled.' };
    }
    return { ok: true, person };
  }

  /** Delete by id; returns whether anything was removed. */
  remove(id: string): boolean {
    const all = this.list();
    const rest = all.filter((p) => p.id !== id);
    if (rest.length === all.length) return false;
    return this.write(rest);
  }
}

export type Theme = 'dark' | 'light';

/** Read the stored theme preference, if any. */
export function readTheme(storage: StorageLike | undefined): Theme | undefined {
  try {
    const value = storage?.getItem(THEME_KEY);
    return value === 'dark' || value === 'light' ? value : undefined;
  } catch {
    return undefined;
  }
}

/** Persist the theme preference; failures are ignored. */
export function writeTheme(storage: StorageLike | undefined, theme: Theme): void {
  try {
    storage?.setItem(THEME_KEY, theme);
  } catch {
    /* storage unavailable: the theme simply will not persist */
  }
}
