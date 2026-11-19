import { DYNAMIC_DASH, DYNAMIC_VARIABLE } from '@ui/palette';
import { renderBodygraph } from '@ui/bodygraph';
import { renderComposite } from '@ui/composite';
import { renderWheel } from '@ui/wheel';
import { resolveCssVars } from '@ui/chart-facts';
import { escapeXml, fmt } from '@ui/svg';
import { stripSvgMeta } from './svg-meta';
import { cardFacts } from './card-facts';
import type { CardFacts, PersonFacts } from './card-facts';
import { containRect, formatOf } from './formats';
import type { Rect } from './formats';
import { MARK_COLOR, MARK_INK, markSvg } from './mark';
import { qrSvg } from './qr';
import { FONT_SANS, FONT_SERIF, paletteFor, paletteLookup, resolveTheme } from './themes';
import type { CardTheme } from './themes';
import {
  SERIF_SCALE,
  fitFontSize,
  truncateToWidth,
  wrapText,
  estimateTextWidth,
} from './text-layout';
import type { SharePrefs, ShareSubject } from './types';

/** The result of building a card. */
export interface CardSvg {
  svg: string;
  width: number;
  height: number;
  /** Optional parts that did not fit this format and were left out. */
  dropped: string[];
}

interface TextOptions {
  size: number;
  weight?: number;
  fill: string;
  serif?: boolean;
  anchor?: 'start' | 'middle' | 'end';
  spacing?: number;
  opacity?: number;
}

/** One `<text>`; `top` is the top of the line box, the baseline sits 0.8 em below. */
function text(x: number, top: number, content: string, o: TextOptions): string {
  const attrs = [
    `x="${fmt(x)}"`,
    `y="${fmt(top + o.size * 0.82)}"`,
    `font-family="${o.serif ? FONT_SERIF : FONT_SANS}"`,
    `font-size="${fmt(o.size)}"`,
    `font-weight="${o.weight ?? 400}"`,
    `fill="${o.fill}"`,
  ];
  if (o.anchor && o.anchor !== 'start') attrs.push(`text-anchor="${o.anchor}"`);
  if (o.spacing) attrs.push(`letter-spacing="${o.spacing}"`);
  if (o.opacity !== undefined) attrs.push(`opacity="${o.opacity}"`);
  return `<text ${attrs.join(' ')}>${escapeXml(content)}</text>`;
}

function lines(
  x: number,
  top: number,
  rows: readonly string[],
  lineHeight: number,
  o: TextOptions,
): string {
  return rows.map((row, i) => text(x, top + i * lineHeight, row, o)).join('');
}

interface Block {
  id: string;
  /** Higher numbers are dropped first when the column is too full. */
  drop?: number;
  h: number;
  draw: (y: number) => string;
}

interface Flowed {
  svg: string;
  dropped: string[];
}

/** Stack blocks top to bottom, dropping optional ones (highest `drop` first) until they fit. */
function flow(blocks: readonly Block[], y: number, height: number, gap: number): Flowed {
  const kept = [...blocks];
  const dropped: string[] = [];
  const total = (list: readonly Block[]): number =>
    list.reduce((s, b) => s + b.h, 0) + Math.max(0, list.length - 1) * gap;
  while (total(kept) > height) {
    let worst = -1;
    let at = -1;
    kept.forEach((b, i) => {
      if ((b.drop ?? 0) > worst) {
        worst = b.drop ?? 0;
        at = i;
      }
    });
    if (worst <= 0 || at < 0) break;
    const [gone] = kept.splice(at, 1);
    if (gone) dropped.push(gone.id);
  }
  const spare = height - total(kept);
  const extra = kept.length > 1 ? Math.max(0, Math.min(spare / (kept.length - 1), gap * 1.1)) : 0;
  let cursor = y;
  let svg = '';
  for (const b of kept) {
    svg += b.draw(cursor);
    cursor += b.h + gap + extra;
  }
  return { svg, dropped };
}

interface Ctx {
  theme: CardTheme;
  facts: CardFacts;
  prefs: SharePrefs;
  subject: ShareSubject;
  width: number;
  height: number;
}

const eyebrow = (ctx: Ctx, x: number, top: number, content: string, size: number): string =>
  text(x, top, content.toUpperCase(), {
    size,
    weight: 700,
    fill: ctx.theme.muted,
    spacing: size * 0.14,
  });

function titleBlock(ctx: Ctx, x: number, top: number, w: number, maxSize: number, minSize: number) {
  const size = fitFontSize(ctx.facts.title, w, maxSize, minSize, 2, 600, SERIF_SCALE);
  const rows = wrapText(ctx.facts.title, w, size, { weight: 600, maxLines: 2, scale: SERIF_SCALE });
  const lh = size * 1.12;
  let h = rows.length * lh;
  let svg = lines(x, top, rows, lh, { size, weight: 600, fill: ctx.theme.text, serif: true });
  if (ctx.facts.birth) {
    const bsize = Math.max(20, Math.round(size * 0.4));
    const brows = wrapText(ctx.facts.birth, w, bsize, { maxLines: 2 });
    svg += lines(x, top + h + 8, brows, bsize * 1.3, { size: bsize, fill: ctx.theme.muted });
    h += 8 + brows.length * bsize * 1.3;
  }
  return { svg, h };
}

function person(ctx: Ctx): PersonFacts {
  return ctx.facts.people[0] as PersonFacts;
}

function typeBlock(ctx: Ctx, x: number, w: number, size: number): Block {
  const p = person(ctx);
  const fit = fitFontSize(p.type, w, size, Math.round(size * 0.6), 2, 600, SERIF_SCALE);
  const rows = wrapText(p.type, w, fit, { weight: 600, maxLines: 2, scale: SERIF_SCALE });
  const lh = fit * 1.1;
  const sub = Math.round(size * 0.4);
  const strategy = wrapText(`Strategy: ${p.strategy}`, w, sub, { maxLines: 2 });
  const h = 22 + rows.length * lh + 8 + strategy.length * sub * 1.3 + 4;
  return {
    id: 'type',
    h,
    draw: (y) =>
      eyebrow(ctx, x, y, 'Type', 17) +
      lines(x, y + 28, rows, lh, { size: fit, weight: 600, fill: ctx.theme.accent, serif: true }) +
      lines(x, y + 28 + rows.length * lh + 8, strategy, sub * 1.3, {
        size: sub,
        fill: ctx.theme.text,
      }),
  };
}

function factsBlock(ctx: Ctx, x: number, w: number, cols: number, size: number): Block {
  const rows = person(ctx).rows.filter((r) => r.label !== 'Strategy' || cols === 0);
  const gapX = 28;
  const cw = (w - gapX * (cols - 1)) / cols;
  const valueSize = size;
  const cells = rows.map((r) => ({
    label: r.label,
    value: wrapText(r.value, cw, valueSize, { maxLines: 2, weight: 600 }),
  }));
  const cellH = (c: { value: string[] }): number => 24 + c.value.length * valueSize * 1.28 + 14;
  const perRow = Math.ceil(cells.length / cols);
  const rowHeights = Array.from({ length: perRow }, (_u, r) =>
    Math.max(...cells.slice(r * cols, r * cols + cols).map(cellH)),
  );
  const h = rowHeights.reduce((s, v) => s + v, 0);
  return {
    id: 'facts',
    h,
    draw: (y) => {
      let svg = '';
      cells.forEach((c, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const cy = y + rowHeights.slice(0, row).reduce((s, v) => s + v, 0);
        const cx = x + col * (cw + gapX);
        svg +=
          eyebrow(ctx, cx, cy, c.label, 16) +
          lines(cx, cy + 24, c.value, valueSize * 1.28, {
            size: valueSize,
            weight: 600,
            fill: ctx.theme.text,
          });
      });
      return svg;
    },
  };
}

function crossBlock(ctx: Ctx, x: number, w: number, size: number): Block {
  const p = person(ctx);
  const rows = wrapText(p.cross, w, size, { maxLines: 3, weight: 600 });
  const h = 24 + rows.length * size * 1.3;
  return {
    id: 'cross',
    drop: 1,
    h,
    draw: (y) =>
      eyebrow(ctx, x, y, 'Incarnation Cross', 16) +
      lines(x, y + 24, rows, size * 1.3, { size, weight: 600, fill: ctx.theme.text }),
  };
}

function barsSvg(ctx: Ctx, x: number, y: number, w: number, cols: number, rowH: number): string {
  const gapX = 36;
  const cw = (w - gapX * (cols - 1)) / cols;
  const labelW = 124;
  const countW = 28;
  const trackX = labelW;
  const trackW = Math.max(20, cw - labelW - countW - 8);
  const barH = 12;
  const track = ctx.theme.id === 'ink' ? '#d9d9d9' : ctx.theme.border;
  return ctx.facts.bars
    .map((b, i) => {
      const cx = x + (i % cols) * (cw + gapX);
      const cy = y + Math.floor(i / cols) * rowH;
      const fillW = Math.max(b.count > 0 ? 6 : 0, (trackW * b.percent) / 100);
      return (
        text(cx, cy + 2, b.label, { size: 20, fill: ctx.theme.text }) +
        `<rect x="${fmt(cx + trackX)}" y="${fmt(cy + 8)}" width="${fmt(trackW)}" height="${barH}" rx="6" fill="${track}"/>` +
        (fillW > 0
          ? `<rect x="${fmt(cx + trackX)}" y="${fmt(cy + 8)}" width="${fmt(fillW)}" height="${barH}" rx="6" fill="${ctx.theme.accent}"/>`
          : '') +
        text(cx + trackX + trackW + 8, cy + 2, String(b.count), {
          size: 20,
          weight: 700,
          fill: ctx.theme.text,
        })
      );
    })
    .join('');
}

function circuitsBlock(ctx: Ctx, x: number, w: number, cols = 1): Block {
  const rowH = 34;
  const rows = Math.ceil(ctx.facts.bars.length / cols);
  return {
    id: 'circuits',
    drop: 3,
    h: 28 + rows * rowH,
    draw: (y) => eyebrow(ctx, x, y, 'Circuits', 16) + barsSvg(ctx, x, y + 28, w, cols, rowH),
  };
}

function qrCaption(ctx: Ctx): string {
  return ctx.facts.kind === 'compare'
    ? 'Scan to open this comparison in Gatecast'
    : 'Scan to open this chart in Gatecast';
}

function qrBlock(ctx: Ctx, x: number, w: number, size: number): Block {
  const capW = Math.max(60, w - size - 22);
  const rows = wrapText(qrCaption(ctx), capW, 20, { maxLines: 4 });
  return {
    id: 'qr',
    drop: 2,
    h: size,
    draw: (y) =>
      qrSvg(ctx.facts.link, x, y, size, { dark: ctx.theme.qrDark, light: ctx.theme.qrLight }, 12) +
      lines(x + size + 22, y + size / 2 - (rows.length * 26) / 2, rows, 26, {
        size: 20,
        fill: ctx.theme.muted,
      }),
  };
}

function personBlock(ctx: Ctx, i: number, x: number, w: number, nameSize: number): Block {
  const p = ctx.facts.people[i] as PersonFacts;
  const markerR = nameSize * 0.2;
  const indent = markerR * 2 + 14;
  const nameRows = wrapText(p.name, w - indent, nameSize, {
    maxLines: 2,
    weight: 600,
    scale: SERIF_SCALE,
  });
  const sub = Math.round(nameSize * 0.66);
  const detail = wrapText(`${p.type} · ${p.profile}`, w - indent, sub, { maxLines: 2 });
  const birth = p.birth ? wrapText(p.birth, w - indent, sub - 2, { maxLines: 1 }) : [];
  const h =
    nameRows.length * nameSize * 1.15 + detail.length * sub * 1.3 + birth.length * sub * 1.3 + 6;
  const color = ctx.theme.id === 'ink' ? '#111111' : i === 0 ? ctx.theme.accent : ctx.theme.text;
  return {
    id: `person-${i}`,
    h,
    draw: (y) => {
      const cy = y + nameSize * 0.55;
      const marker =
        i === 0
          ? `<circle cx="${fmt(x + markerR)}" cy="${fmt(cy)}" r="${fmt(markerR)}" fill="none" stroke="${color}" stroke-width="3"/>`
          : `<rect x="${fmt(x)}" y="${fmt(cy - markerR)}" width="${fmt(markerR * 2)}" height="${fmt(markerR * 2)}" fill="none" stroke="${color}" stroke-width="3"/>`;
      let cursor = y;
      let svg = marker;
      svg += lines(x + indent, cursor, nameRows, nameSize * 1.15, {
        size: nameSize,
        weight: 600,
        fill: ctx.theme.text,
        serif: true,
      });
      cursor += nameRows.length * nameSize * 1.15;
      svg += lines(x + indent, cursor, detail, sub * 1.3, { size: sub, fill: color, weight: 600 });
      cursor += detail.length * sub * 1.3;
      svg += lines(x + indent, cursor, birth, sub * 1.3, { size: sub - 2, fill: ctx.theme.muted });
      return svg;
    },
  };
}

function dynamicsBlock(ctx: Ctx, x: number, w: number): Block {
  const flavour = ctx.theme.palette;
  const rowH = 36;
  return {
    id: 'dynamics',
    h: 28 + ctx.facts.dynamics.length * rowH,
    draw: (y) => {
      let svg = eyebrow(ctx, x, y, 'Channel dynamics', 16);
      ctx.facts.dynamics.forEach((d, i) => {
        const cy = y + 28 + i * rowH;
        const dash = DYNAMIC_DASH[d.kind];
        svg +=
          `<line x1="${fmt(x + 3)}" y1="${fmt(cy + 13)}" x2="${fmt(x + 55)}" y2="${fmt(cy + 13)}" ` +
          `stroke="${paletteFor(DYNAMIC_VARIABLE[d.kind], flavour)}" stroke-width="7" ` +
          `stroke-linecap="${d.kind === 'dominance' ? 'round' : 'butt'}"` +
          (dash ? ` stroke-dasharray="${dash}"` : '') +
          '/>' +
          text(x + 72, cy + 2, d.label, { size: 22, fill: ctx.theme.text }) +
          text(x + w, cy + 2, String(d.count), {
            size: 22,
            weight: 700,
            fill: ctx.theme.text,
            anchor: 'end',
          });
      });
      return svg;
    },
  };
}

function sentenceBlock(ctx: Ctx, x: number, w: number, size: number, maxLines: number): Block {
  const rows = wrapText(ctx.facts.sentence, w, size, { maxLines });
  return {
    id: 'sentence',
    drop: 1,
    h: rows.length * size * 1.35,
    draw: (y) => lines(x, y, rows, size * 1.35, { size, fill: ctx.theme.text }),
  };
}

function background(ctx: Ctx): string {
  const { theme, width, height } = ctx;
  const base = `<rect width="${width}" height="${height}" fill="${theme.bg}"/>`;
  if (theme.id === 'ink') return base;
  return (
    `<defs><radialGradient id="gc-bg" cx="0.85" cy="0" r="1.1">` +
    `<stop offset="0" stop-color="${theme.bg2}"/><stop offset="1" stop-color="${theme.bg}"/>` +
    `</radialGradient></defs><rect width="${width}" height="${height}" fill="url(#gc-bg)"/>` +
    `<rect x="0" y="0" width="${width}" height="8" fill="${theme.accent}"/>`
  );
}

function header(ctx: Ctx, x: number, top: number, w: number, label: string, size: number): string {
  let svg = eyebrow(ctx, x, top, label, size);
  const logo = ctx.prefs.logo;
  if (logo) {
    const bh = 52;
    const bw = 170;
    svg += `<image href="${logo}" x="${fmt(x + w - bw)}" y="${fmt(top - 12)}" width="${bw}" height="${bh}" preserveAspectRatio="xMaxYMid meet"/>`;
  }
  return svg;
}

/** The "Prepared by ..." line, or empty. */
export function preparedLine(prefs: SharePrefs): string {
  const by = prefs.preparedBy.trim();
  const parts = [by ? `Prepared by ${by}` : '', prefs.contact.trim()].filter(Boolean);
  return parts.join(' · ');
}

function footer(ctx: Ctx, x: number, top: number, w: number): string {
  const { theme, prefs } = ctx;
  const size = 20;
  let right = 0;
  let svg = '';
  if (prefs.showWatermark) {
    const label = 'Made with gatecast';
    const lw = estimateTextWidth(label, size, 600);
    const markSize = 30;
    right = markSize + 10 + lw;
    const colors = theme.id === 'ink' ? MARK_INK : MARK_COLOR;
    svg +=
      markSvg(x + w - right, top - 3, markSize, colors, 'card') +
      text(x + w - lw, top + 1, label, { size, weight: 600, fill: theme.muted });
  }
  const line = preparedLine(prefs);
  if (line) {
    const avail = Math.max(80, w - right - (right ? 24 : 0));
    svg += text(
      x,
      top + 1,
      truncateToWidth(line, avail, (t) => estimateTextWidth(t, size)),
      {
        size,
        fill: theme.muted,
      },
    );
  }
  if (svg) {
    svg =
      `<line x1="${x}" y1="${fmt(top - 16)}" x2="${x + w}" y2="${fmt(top - 16)}" stroke="${theme.border}" stroke-width="1.5"/>` +
      svg;
  }
  return svg;
}

function heroGraphic(ctx: Ctx): { markup: string; aspect: number } {
  const lookup = paletteLookup(ctx.theme.palette);
  const s = ctx.subject;
  if (s.kind === 'compare') {
    return {
      markup: resolveCssVars(
        renderComposite(s.a, s.b, s.comparison, { legend: false, idPrefix: 'card' }),
        lookup,
      ),
      aspect: 400 / 600,
    };
  }
  if (ctx.prefs.hero === 'wheel') {
    return {
      markup: resolveCssVars(renderWheel(s.chart, { idPrefix: 'card' }), lookup),
      aspect: 1,
    };
  }
  return {
    markup: resolveCssVars(renderBodygraph(s.chart, { idPrefix: 'card' }), lookup),
    aspect: 400 / 600,
  };
}

/** Draw the hero panel, shrunk to the graphic's shape, left-aligned or centred in `area`. */
function hero(
  ctx: Ctx,
  area: Rect,
  align: 'left' | 'center' = 'left',
): { svg: string; rect: Rect } {
  const graphic = heroGraphic(ctx);
  const markup = stripSvgMeta(graphic.markup);
  const aspect = graphic.aspect;
  const pad = 16;
  const fitted = Math.min(area.w, (area.h - pad * 2) * aspect + pad * 2);
  const panel: Rect = {
    ...area,
    w: fitted,
    x: align === 'center' ? area.x + (area.w - fitted) / 2 : area.x,
  };
  const box = containRect(
    { x: panel.x + pad, y: panel.y + pad, w: panel.w - pad * 2, h: panel.h - pad * 2 },
    aspect,
  );
  const placed = markup.replace(
    '<svg ',
    `<svg x="${fmt(box.x)}" y="${fmt(box.y)}" width="${fmt(box.w)}" height="${fmt(box.h)}" `,
  );
  const fill = ctx.theme.id === 'ink' ? 'none' : ctx.theme.surface;
  const svg =
    `<rect x="${fmt(panel.x)}" y="${fmt(panel.y)}" width="${fmt(panel.w)}" height="${fmt(panel.h)}" rx="28" ` +
    `fill="${fill}" stroke="${ctx.theme.border}" stroke-width="1.5"/>` +
    placed;
  return { svg, rect: panel };
}

interface Layout {
  body: string;
  dropped: string[];
}

function eyebrowLabel(ctx: Ctx): string {
  return ctx.facts.kind === 'compare' ? 'Human Design · Comparison' : 'Human Design';
}

/** Column blocks for a chart or comparison, depending on what the column holds. */
function columnBlocks(
  ctx: Ctx,
  x: number,
  w: number,
  o: {
    typeSize: number;
    factSize: number;
    nameSize: number;
    cols: number;
    qr?: number;
    circuits: boolean;
    qrDrop?: boolean;
  },
): Block[] {
  const blocks: Block[] = [];
  if (ctx.facts.kind === 'chart') {
    blocks.push(typeBlock(ctx, x, w, o.typeSize), factsBlock(ctx, x, w, o.cols, o.factSize));
    blocks.push(crossBlock(ctx, x, w, o.factSize));
    if (o.circuits && ctx.prefs.showCircuits) blocks.push(circuitsBlock(ctx, x, w));
  } else {
    blocks.push(personBlock(ctx, 0, x, w, o.nameSize), personBlock(ctx, 1, x, w, o.nameSize));
    blocks.push(dynamicsBlock(ctx, x, w));
    if (o.circuits) blocks.push(sentenceBlock(ctx, x, w, 20, 5));
  }
  if (o.qr && ctx.prefs.showQr) blocks.push(qrBlock(ctx, x, w, o.qr));
  return blocks;
}

function layoutSquare(ctx: Ctx): Layout {
  const m = 64;
  const w = ctx.width - m * 2;
  const title = titleBlock(ctx, m, 112, w, 58, 34);
  const bodyTop = Math.max(244, 112 + title.h + 28);
  const bottom = ctx.height - m - 40;
  const heroPanel = hero(ctx, { x: m, y: bodyTop, w: 500, h: bottom - bodyTop });
  const colX = heroPanel.rect.x + heroPanel.rect.w + 36;
  const colW = ctx.width - m - colX;
  const col = flow(
    columnBlocks(ctx, colX, colW, {
      typeSize: 54,
      factSize: 25,
      nameSize: 34,
      cols: 1,
      qr: 168,
      circuits: true,
    }),
    bodyTop,
    bottom - bodyTop,
    18,
  );
  const body =
    header(ctx, m, 56, w, eyebrowLabel(ctx), 20) +
    title.svg +
    heroPanel.svg +
    col.svg +
    footer(ctx, m, ctx.height - m - 8, w);
  return { body, dropped: col.dropped };
}

function layoutPortrait(ctx: Ctx): Layout {
  const m = 64;
  const w = ctx.width - m * 2;
  const title = titleBlock(ctx, m, 120, w, 72, 38);
  const bodyTop = Math.max(280, 120 + title.h + 30);
  const showBars = ctx.facts.kind === 'chart' && ctx.prefs.showCircuits;
  const showSentence = ctx.facts.kind === 'compare';
  const band = ctx.prefs.showQr || showBars || showSentence;
  const contentBottom = ctx.height - m - 40;
  const bandH = band ? 190 : 0;
  const bodyBottom = contentBottom - (band ? bandH + 36 : 0);
  const heroPanel = hero(ctx, { x: m, y: bodyTop, w: 520, h: bodyBottom - bodyTop });
  const colX = heroPanel.rect.x + heroPanel.rect.w + 40;
  const colW = ctx.width - m - colX;
  const col = flow(
    columnBlocks(ctx, colX, colW, {
      typeSize: 58,
      factSize: 27,
      nameSize: 36,
      cols: 1,
      circuits: false,
    }),
    bodyTop,
    bodyBottom - bodyTop,
    26,
  );
  let svg = heroPanel.svg + col.svg;
  if (band) {
    const top = contentBottom - bandH;
    const qr = ctx.prefs.showQr ? 190 : 0;
    const bandW = w - (qr ? qr + 40 : 0);
    svg += `<line x1="${m}" y1="${top - 18}" x2="${m + w}" y2="${top - 18}" stroke="${ctx.theme.border}" stroke-width="1.5"/>`;
    if (showBars) svg += circuitsBlock(ctx, m, bandW, 2).draw(top + 12);
    if (showSentence) {
      const b = sentenceBlock(ctx, m, bandW, 24, 6);
      svg += eyebrow(ctx, m, top + 12, 'Circuits', 16) + b.draw(top + 44);
    }
    if (qr) {
      svg += qrSvg(
        ctx.facts.link,
        m + w - qr,
        top,
        qr,
        { dark: ctx.theme.qrDark, light: ctx.theme.qrLight },
        14,
      );
    }
  }
  svg =
    header(ctx, m, 56, w, eyebrowLabel(ctx), 22) +
    title.svg +
    svg +
    footer(ctx, m, ctx.height - m - 8, w);
  return { body: svg, dropped: col.dropped };
}

function layoutStory(ctx: Ctx): Layout {
  const m = 72;
  const w = ctx.width - m * 2;
  const title = titleBlock(ctx, m, 210, w, 84, 44);
  const heroTop = 210 + title.h + 30;
  const heroH = 780;
  const heroW = 640;
  const textTop = heroTop + heroH + 32;
  const colW = (w - 40) / 2;
  const left: Block[] = [];
  const right: Block[] = [];
  if (ctx.facts.kind === 'chart') {
    left.push(typeBlock(ctx, m, colW, 56), crossBlock(ctx, m, colW, 24));
    right.push(factsBlock(ctx, m + colW + 40, colW, 1, 24));
  } else {
    left.push(personBlock(ctx, 0, m, colW, 34), personBlock(ctx, 1, m, colW, 34));
    right.push(dynamicsBlock(ctx, m + colW + 40, colW));
  }
  const textH = 300;
  const l = flow(left, textTop, textH, 14);
  const r = flow(right, textTop, textH, 14);
  const bandTop = textTop + textH + 40;
  const qr = ctx.prefs.showQr ? 190 : 0;
  const bandW = w - (qr ? qr + 40 : 0);
  let band = '';
  if (ctx.facts.kind === 'chart' && ctx.prefs.showCircuits)
    band += circuitsBlock(ctx, m, bandW, 2).draw(bandTop + 8);
  if (ctx.facts.kind === 'compare') {
    band +=
      eyebrow(ctx, m, bandTop + 8, 'Circuits', 16) +
      sentenceBlock(ctx, m, bandW, 24, 5).draw(bandTop + 40);
  }
  if (qr) {
    band += qrSvg(
      ctx.facts.link,
      m + w - qr,
      bandTop,
      qr,
      { dark: ctx.theme.qrDark, light: ctx.theme.qrLight },
      14,
    );
  }
  const body =
    header(ctx, m, 150, w, eyebrowLabel(ctx), 22) +
    title.svg +
    hero(ctx, { x: (ctx.width - heroW) / 2, y: heroTop, w: heroW, h: heroH }, 'center').svg +
    l.svg +
    r.svg +
    band +
    footer(ctx, m, 1786, w);
  return { body, dropped: [...l.dropped, ...r.dropped] };
}

function layoutLandscape(ctx: Ctx): Layout {
  const m = 44;
  const panel: Rect = { x: m, y: m, w: 380, h: ctx.height - m * 2 };
  const colX = 468;
  const colW = ctx.width - m - colX;
  const qr = ctx.prefs.showQr ? 132 : 0;
  const textW = colW - (qr ? qr + 36 : 0);
  const title = titleBlock(ctx, colX, m + 34, colW, 50, 30);
  const footTop = ctx.height - m - 8;
  const top = m + 34 + title.h + 18;
  const bottom = footTop - 34;
  let blocks: Block[];
  if (ctx.facts.kind === 'chart') {
    blocks = [
      typeBlock(ctx, colX, textW, 46),
      factsBlock(ctx, colX, textW, 2, 22),
      crossBlock(ctx, colX, textW, 20),
    ];
  } else {
    blocks = [
      personBlock(ctx, 0, colX, textW, 30),
      personBlock(ctx, 1, colX, textW, 30),
      { ...dynamicsBlock(ctx, colX, textW), drop: 1 },
    ];
  }
  const col = flow(blocks, top, bottom - top, 14);
  let qrSvgMarkup = '';
  if (qr) {
    qrSvgMarkup = qrSvg(
      ctx.facts.link,
      ctx.width - m - qr,
      bottom - qr,
      qr,
      { dark: ctx.theme.qrDark, light: ctx.theme.qrLight },
      10,
    );
  }
  const body =
    hero(ctx, panel).svg +
    header(ctx, colX, m, colW, eyebrowLabel(ctx), 18) +
    title.svg +
    col.svg +
    qrSvgMarkup +
    footer(ctx, colX, footTop, colW);
  return { body, dropped: col.dropped };
}

/**
 * Build a share card as a standalone SVG string with exact pixel size, concrete
 * colours (no CSS variables), system fonts only and every user string escaped.
 *
 * @param subject The chart or comparison.
 * @param prefs Format, theme, accent, privacy toggles and the practitioner's details.
 */
export function buildCardSvg(subject: ShareSubject, prefs: SharePrefs): CardSvg {
  const format = formatOf(prefs.format);
  const ctx: Ctx = {
    theme: resolveTheme(prefs.theme, prefs.accent),
    facts: cardFacts(subject, prefs),
    prefs,
    subject,
    width: format.width,
    height: format.height,
  };
  const layout =
    format.id === 'square'
      ? layoutSquare(ctx)
      : format.id === 'portrait'
        ? layoutPortrait(ctx)
        : format.id === 'story'
          ? layoutStory(ctx)
          : layoutLandscape(ctx);
  const label = `${ctx.facts.title}. ${ctx.facts.people.map((p) => p.type).join(' and ')}.`;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${format.width}" height="${format.height}" ` +
    `viewBox="0 0 ${format.width} ${format.height}" role="img" aria-label="${escapeXml(label)}">` +
    `<title>${escapeXml(label)}</title>` +
    background(ctx) +
    layout.body +
    '</svg>';
  return { svg, width: format.width, height: format.height, dropped: layout.dropped };
}
