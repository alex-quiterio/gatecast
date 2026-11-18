import { describe, expect, test } from 'bun:test';
import type { BirthInput } from '@/types';
import {
  MAX_PEOPLE,
  PEOPLE_KEY,
  PeopleStore,
  readTheme,
  writeTheme,
  type StorageLike,
} from '@ui/storage';

class MemoryStorage implements StorageLike {
  data = new Map<string, string>();
  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
  removeItem(key: string): void {
    this.data.delete(key);
  }
}
const throwing: StorageLike = {
  getItem() {
    throw new Error('blocked');
  },
  setItem() {
    throw new DOMException('full', 'QuotaExceededError');
  },
  removeItem() {
    throw new Error('blocked');
  },
};
const person = (day: number): BirthInput => ({
  name: `Example ${day}`,
  date: `1990-01-${String(day).padStart(2, '0')}`,
  time: '09:30',
  utcOffset: 1,
});

describe('PeopleStore', () => {
  test('add, list newest first, remove', () => {
    const store = new PeopleStore(new MemoryStorage());
    store.add(person(1));
    const added = store.add(person(2));
    expect(store.list().map((p) => p.input.name)).toEqual(['Example 2', 'Example 1']);
    if (!added.ok) throw new Error('expected ok');
    expect(store.remove(added.person.id)).toBe(true);
    expect(store.remove('missing')).toBe(false);
    expect(store.list()).toHaveLength(1);
  });
  test('saving the same person again does not duplicate', () => {
    const store = new PeopleStore(new MemoryStorage());
    store.add(person(1));
    store.add(person(1));
    expect(store.list()).toHaveLength(1);
  });
  test('caps at 50', () => {
    const store = new PeopleStore(new MemoryStorage());
    for (let i = 0; i < MAX_PEOPLE; i++) {
      const input = {
        ...person(1),
        time: `${String(Math.floor(i / 60)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}`,
      };
      expect(store.add(input).ok).toBe(true);
    }
    const result = store.add(person(5));
    expect(result.ok).toBe(false);
    expect(store.list()).toHaveLength(MAX_PEOPLE);
  });
  test('corrupt JSON and wrong shapes read as empty or are filtered', () => {
    const storage = new MemoryStorage();
    const store = new PeopleStore(storage);
    storage.setItem(PEOPLE_KEY, '{not json');
    expect(store.list()).toEqual([]);
    storage.setItem(PEOPLE_KEY, '{"a":1}');
    expect(store.list()).toEqual([]);
    storage.setItem(
      PEOPLE_KEY,
      JSON.stringify([
        null,
        7,
        { input: null },
        { input: { name: 'x', date: 'nope', time: '09:30', utcOffset: 1 } },
        { input: { name: 'Fine', date: '1990-01-02', time: '09:30', utcOffset: 1 } },
      ]),
    );
    expect(store.list().map((p) => p.input.name)).toEqual(['Fine']);
  });
  test('unavailable storage and quota errors never throw', () => {
    for (const storage of [throwing, undefined]) {
      const store = new PeopleStore(storage);
      expect(store.list()).toEqual([]);
      expect(store.add(person(1)).ok).toBe(false);
      expect(store.remove('x')).toBe(false);
    }
  });
});

describe('theme storage', () => {
  test('round trip and invalid values', () => {
    const storage = new MemoryStorage();
    expect(readTheme(storage)).toBeUndefined();
    writeTheme(storage, 'light');
    expect(readTheme(storage)).toBe('light');
    storage.setItem('hd:v1:theme', 'purple');
    expect(readTheme(storage)).toBeUndefined();
    expect(() => writeTheme(throwing, 'dark')).not.toThrow();
    expect(readTheme(throwing)).toBeUndefined();
  });
});
