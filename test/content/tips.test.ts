import { describe, expect, test } from 'bun:test';
import { CENTER_NAMES, PLANET_NAMES } from '@/types';
import { CHANNEL_LIST, channelKey } from '@engine/data';
import {
  AUTHORITIES,
  DEFINITIONS,
  DYNAMICS,
  GLOSSARY,
  PROFILES,
  TIP_BODY_MAX,
  TYPES,
  parseTipKey,
  tipFor,
} from '@content';

function expectValid(key: string): void {
  const tip = tipFor(key);
  expect(tip).toBeDefined();
  expect(tip?.title.length).toBeGreaterThan(0);
  expect(tip?.body.length).toBeGreaterThan(0);
  expect(tip?.body.length).toBeLessThanOrEqual(TIP_BODY_MAX);
  expect(/[<>]/.test(`${tip?.title}${tip?.body}`)).toBe(false);
}

describe('tipFor', () => {
  test('every gate', () => {
    for (let n = 1; n <= 64; n++) expectValid(`gate:${n}`);
    expect(tipFor('gate:20')?.title).toBe('Gate 20 · The Now');
  });

  test('every channel', () => {
    for (const c of CHANNEL_LIST) expectValid(`channel:${channelKey(...c.gates)}`);
    expect(tipFor('channel:20-34')?.title).toContain('Charisma');
  });

  test('every other family', () => {
    for (const c of CENTER_NAMES) expectValid(`center:${c}`);
    for (const p of PLANET_NAMES) expectValid(`planet:${p}`);
    for (const t of Object.keys(TYPES)) expectValid(`type:${t}`);
    for (const a of Object.keys(AUTHORITIES)) expectValid(`authority:${a}`);
    for (const p of Object.keys(PROFILES)) expectValid(`profile:${p}`);
    for (let l = 1; l <= 6; l++) expectValid(`line:${l}`);
    for (const d of Object.keys(DEFINITIONS)) expectValid(`definition:${d}`);
    for (const d of Object.keys(DYNAMICS)) expectValid(`dynamic:${d}`);
    for (const g of GLOSSARY) expectValid(`term:${g.term}`);
  });

  test('terms are case-insensitive', () => {
    expect(tipFor('term:strategy')?.title).toBe('Strategy');
    expect(tipFor('term:STRATEGY')?.title).toBe('Strategy');
  });

  test('center names are forgiving about spaces', () => {
    expect(tipFor('center:Solar Plexus')).toEqual(tipFor('center:SolarPlexus'));
  });

  test('garbage returns undefined', () => {
    for (const key of [
      '',
      'gate',
      'gate:',
      ':20',
      'gate:0',
      'gate:65',
      'gate:abc',
      'gate:-1',
      'gate:2.5',
      'channel:1-2',
      'channel:34-20',
      'center:Nose',
      'planet:Pluto2',
      'type:Nobody',
      'line:0',
      'line:7',
      'profile:7/7',
      'term:nonsense',
      'unknown:1',
      'gate:__proto__',
      'term:constructor',
    ]) {
      expect(tipFor(key)).toBeUndefined();
    }
  });

  test('parseTipKey', () => {
    expect(parseTipKey('gate:20')).toEqual({ family: 'gate', id: '20' });
    expect(parseTipKey('term:a:b')).toEqual({ family: 'term', id: 'a:b' });
    expect(parseTipKey('nope')).toBeUndefined();
    expect(parseTipKey('gate:')).toBeUndefined();
  });
});
