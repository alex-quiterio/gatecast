import { describe, expect, test } from 'bun:test';
import type { BirthInput } from '@/types';
import { buildHash, parseRoute } from '@ui/router';

const person: BirthInput = {
  name: 'Example Person',
  date: '1990-03-14',
  time: '09:30',
  utcOffset: 1,
  timeZone: 'Europe/Lisbon',
};
const other: BirthInput = { name: 'Sample Two', date: '1985-07-02', time: '21:05', utcOffset: -4 };

describe('parseRoute', () => {
  test('home variants are the chart route', () => {
    for (const hash of ['', '#', '#/', '#/chart', '/']) {
      expect(parseRoute(hash)).toEqual({ name: 'chart' });
    }
  });
  test('chart with person', () => {
    const route = parseRoute(buildHash({ name: 'chart', person }));
    expect(route).toEqual({ name: 'chart', person });
  });
  test('chart with invalid person falls back to empty chart', () => {
    expect(parseRoute('#/chart?d=2000-13-45&t=09:30&u=1')).toEqual({ name: 'chart' });
    expect(parseRoute('#/chart?d=2000-01-31&t=09:30&u=abc')).toEqual({ name: 'chart' });
    expect(parseRoute('#/chart?d=2000-01-31')).toEqual({ name: 'chart' });
  });
  test('compare round trip, partial and empty', () => {
    expect(parseRoute(buildHash({ name: 'compare', a: person, b: other }))).toEqual({
      name: 'compare',
      a: person,
      b: other,
    });
    expect(parseRoute('#/compare')).toEqual({ name: 'compare' });
    const half = parseRoute(`#/compare?a=${encodeURIComponent('d=1990-03-14&t=09:30&u=1')}`);
    expect(half.name).toBe('compare');
    expect('b' in half).toBe(false);
  });
  test('library routes', () => {
    expect(parseRoute('#/library')).toEqual({ name: 'library', tab: 'gate' });
    expect(parseRoute('#/library/channel')).toEqual({ name: 'library', tab: 'channel' });
    expect(parseRoute('#/library/gate/20')).toEqual({ name: 'library', tab: 'gate', id: '20' });
    expect(parseRoute(buildHash({ name: 'library', tab: 'profile', id: '5/1' }))).toEqual({
      name: 'library',
      tab: 'profile',
      id: '5/1',
    });
    expect(parseRoute('#/library/nope')).toMatchObject({ name: 'notFound' });
  });
  test('about and unknown routes', () => {
    expect(parseRoute('#/about')).toEqual({ name: 'about' });
    expect(parseRoute('#/nowhere')).toEqual({ name: 'notFound', path: '/nowhere' });
    expect(parseRoute('#/about/extra')).toMatchObject({ name: 'notFound' });
  });
  test('hostile input never throws', () => {
    const hostile = [
      '#/%E0%A4%A',
      '#/library/gate/%3Cscript%3Ealert(1)%3C%2Fscript%3E',
      '#/chart?n=' + 'x'.repeat(5000),
      '#/../../etc/passwd',
      '#/library/gate/' + 'a'.repeat(500),
      '#/chart?__proto__=1&d[]=1',
      '#//////',
      '#?',
    ];
    for (const hash of hostile) expect(() => parseRoute(hash)).not.toThrow();
    expect(parseRoute('#/library/gate/%3Cscript%3E')).toEqual({ name: 'library', tab: 'gate' });
    expect(parseRoute('#/%E0%A4%A').name).toBe('notFound');
  });
});

describe('buildHash', () => {
  test('canonical hashes', () => {
    expect(buildHash({ name: 'chart' })).toBe('#/');
    expect(buildHash({ name: 'about' })).toBe('#/about');
    expect(buildHash({ name: 'compare' })).toBe('#/compare');
    expect(buildHash({ name: 'library', tab: 'gate', id: '20' })).toBe('#/library/gate/20');
    expect(buildHash({ name: 'notFound', path: '/x' })).toBe('#/');
  });
});
