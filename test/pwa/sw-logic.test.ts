import { describe, expect, test } from 'bun:test';
import {
  buildPrecacheList,
  cacheVersion,
  classifyRequest,
  hashString,
  isPrecachable,
  precacheName,
  staleCaches,
} from '@/sw-logic';

const scope = 'https://example.github.io/gatecast/';
const base = { method: 'GET', mode: 'cors', scope };

describe('classifyRequest', () => {
  test('navigations in scope', () => {
    expect(classifyRequest({ ...base, mode: 'navigate', url: `${scope}#/chart` })).toBe('navigate');
    expect(classifyRequest({ ...base, mode: 'navigate', url: `${scope}404.html` })).toBe(
      'navigate',
    );
  });
  test('places.json is runtime cached', () => {
    expect(classifyRequest({ ...base, url: `${scope}places.json` })).toBe('runtime');
  });
  test('same-origin assets are static', () => {
    expect(classifyRequest({ ...base, url: `${scope}main.js` })).toBe('static');
  });
  test('ignores cross-origin, non-GET, out of scope and garbage', () => {
    expect(classifyRequest({ ...base, url: 'https://cdn.example.com/x.js' })).toBe('ignore');
    expect(classifyRequest({ ...base, method: 'POST', url: `${scope}main.js` })).toBe('ignore');
    expect(classifyRequest({ ...base, url: 'https://example.github.io/other/x.js' })).toBe(
      'ignore',
    );
    expect(classifyRequest({ ...base, url: 'not a url' })).toBe('ignore');
  });
});

describe('precache list', () => {
  const files = ['index.html', 'main.js', 'main.js.map', 'sw.js', 'places.json', '.nojekyll'];
  test('excludes worker, maps, dotfiles, optional and screenshots', () => {
    expect(isPrecachable('sw.js')).toBe(false);
    expect(isPrecachable('main.js.map')).toBe(false);
    expect(isPrecachable('places.json')).toBe(false);
    expect(isPrecachable('screenshots/wide.png')).toBe(false);
    expect(isPrecachable('icons/icon-192.png')).toBe(true);
  });
  test('relative, sorted, root alias, deterministic', () => {
    const list = buildPrecacheList([...files, 'icons/a.png']);
    expect(list).toEqual(['./', './icons/a.png', './index.html', './main.js']);
    expect(buildPrecacheList([...files].reverse().concat('icons/a.png'))).toEqual(list);
    expect(list.every((u) => u.startsWith('./'))).toBe(true);
  });
});

describe('versioning', () => {
  test('hash is deterministic and sensitive', () => {
    expect(hashString('a')).toBe(hashString('a'));
    expect(hashString('a')).not.toBe(hashString('b'));
  });
  test('version ignores entry order but not content', () => {
    const a = { path: './a', hash: '1' };
    const b = { path: './b', hash: '2' };
    expect(cacheVersion([a, b])).toBe(cacheVersion([b, a]));
    expect(cacheVersion([a, b])).not.toBe(cacheVersion([a, { ...b, hash: '3' }]));
  });
  test('selects only old precaches for deletion', () => {
    const current = precacheName('v2');
    const names = [precacheName('v1'), current, 'gatecast-runtime', 'other-app'];
    expect(staleCaches(names, current)).toEqual([precacheName('v1')]);
  });
});
