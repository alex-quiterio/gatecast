import { describe, expect, test } from 'bun:test';
import { attrs, el, escapeXml, fmt, svgRoot } from '@ui/svg';
import { checkXml } from '@test/helpers/xml';

describe('escapeXml', () => {
  test('neutralises a hostile name', () => {
    const out = escapeXml('"><script>alert(1)</script>');
    expect(out).not.toContain('<');
    expect(out).not.toContain('>');
    expect(out).not.toContain('"');
    expect(out).toBe('&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;');
  });
  test('escapes ampersands first and apostrophes', () => {
    expect(escapeXml("a & b's <c>")).toBe('a &amp; b&#39;s &lt;c&gt;');
  });
});

describe('helpers', () => {
  test('fmt trims decimals', () => {
    expect(fmt(1.23456)).toBe('1.23');
    expect(fmt(2)).toBe('2');
    expect(fmt(-0.001)).toBe('0');
  });
  test('attrs skips undefined and false and escapes values', () => {
    expect(attrs({ a: 1, b: undefined, c: false, d: 'x"y', e: true })).toBe(
      ' a="1" d="x&quot;y" e="true"',
    );
  });
  test('el self-closes without children', () => {
    expect(el('circle', { r: 1 })).toBe('<circle r="1"/>');
    expect(el('g', {}, 'x')).toBe('<g>x</g>');
  });
  test('svgRoot is responsive and accessible', () => {
    const svg = svgRoot({
      viewBox: '0 0 10 10',
      className: 'x',
      idPrefix: 'p',
      title: 'T <b>',
      description: 'D',
      body: '',
    });
    expect(svg).toContain('viewBox="0 0 10 10"');
    expect(svg).toContain('role="img"');
    expect(svg.slice(0, svg.indexOf('>'))).not.toMatch(/\swidth=|\sheight=/);
    expect(svg).toContain('<title id="p-title">T &lt;b&gt;</title>');
    expect(checkXml(svg).ok).toBe(true);
  });
});
