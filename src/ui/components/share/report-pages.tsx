import type { VNode } from 'preact';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'preact/hooks';
import { DISCLAIMER } from '@content';
import { PAPERS, PAGE_MM, PX_PER_MM, contentHeightMm, contentWidthMm } from '@ui/share/paper';
import { paginate } from '@ui/share/paginate';
import type { BlockMeta } from '@ui/share/paginate';
import { MARK_COLOR, MARK_INK, markSvg } from '@ui/share/mark';
import { shortDisclaimer } from '@ui/share/report-model';
import type { ReportModel } from '@ui/share/report-model';
import type { ShareSubject } from '@ui/share/types';
import { buildBlocks } from './report-blocks';
import type { ReportBlock } from './report-blocks';

/** Props of {@link ReportPages}. */
export interface ReportPagesProps {
  model: ReportModel;
  subject: ShareSubject;
  /** Preview scale (1 = real size); the paginated pages are scaled with CSS only. */
  scale?: number;
  /** Called with the page count whenever pagination settles. */
  onPaginated?: (pages: number) => void;
}

function estimatePages(blocks: readonly ReportBlock[], pageMm: number): number[][] {
  return paginate(
    blocks.map((b) => ({
      height: b.estimateMm,
      keepWithNext: b.keepWithNext ?? false,
      breakBefore: b.breakBefore ?? false,
    })),
    pageMm,
  );
}

function PageMark({ ink, id }: { ink: boolean; id: string }): VNode {
  return (
    <svg
      viewBox="0 0 128 128"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: markSvg(0, 0, 128, ink ? MARK_INK : MARK_COLOR, id) }}
    />
  );
}

function PageView({
  model,
  blocks,
  indices,
  number,
  total,
}: {
  model: ReportModel;
  blocks: readonly ReportBlock[];
  indices: readonly number[];
  number: number;
  total: number;
}): VNode {
  const by = model.preparedBy ? `Prepared by ${model.preparedBy}` : '';
  const left = [by, model.contact].filter(Boolean).join(' · ');
  return (
    <section class="rp-page" aria-label={`Page ${number} of ${total}`}>
      <header class="rp-head">
        <div class="rp-head__brand">
          {model.logo ? <img class="rp-head__logo" src={model.logo} alt="" /> : null}
          <strong>{model.title}</strong>
        </div>
        {model.preparedFor ? (
          <div class="rp-head__for">
            Prepared for <strong>{model.preparedFor}</strong>
          </div>
        ) : null}
      </header>
      <div class="rp-content">
        {indices.map((i) => {
          const block = blocks[i];
          return block ? (
            <div class="rp-b" key={block.id}>
              {block.node}
            </div>
          ) : null;
        })}
      </div>
      <footer class="rp-foot">
        <div class="rp-foot__row">
          <span>{left || `Generated ${model.generated}`}</span>
          <span class="rp-foot__page">
            {left ? `Generated ${model.generated} · ` : ''}Page {number} of {total}
          </span>
        </div>
        <div class="rp-foot__row">
          <span class="rp-foot__legal">{shortDisclaimer(DISCLAIMER)}</span>
          {model.watermark ? (
            <span class="rp-wm">
              <PageMark ink={model.theme === 'ink'} id={`pg${number}`} />
              Made with gatecast
            </span>
          ) : null}
        </div>
      </footer>
    </section>
  );
}

/**
 * The report as real, fixed-size pages. Blocks are measured in a hidden copy
 * at the content width, then distributed onto pages by `paginate`, so the
 * preview, the print output and the downloaded HTML share one layout and
 * every page carries its own running header, footer and "Page n of N".
 */
export function ReportPages({ model, subject, scale, onPaginated }: ReportPagesProps) {
  const paper = PAPERS[model.paper];
  const pageMm = contentHeightMm(paper);
  const measureRef = useRef<HTMLDivElement>(null);
  const measureBlocks = useMemo(
    () => buildBlocks({ model, subject, idPrefix: 'rm' }),
    [model, subject],
  );
  const pageBlocks = useMemo(
    () => buildBlocks({ model, subject, idPrefix: 'rp' }),
    [model, subject],
  );
  const [pages, setPages] = useState<number[][]>(() => estimatePages(pageBlocks, pageMm));
  const [fontsTick, setFontsTick] = useState(0);

  useLayoutEffect(() => {
    const root = measureRef.current;
    if (!root) return;
    const nodes = [...root.children] as HTMLElement[];
    const heights = nodes.map((n) => n.getBoundingClientRect().height);
    if (heights.length !== measureBlocks.length || heights.every((h) => h === 0)) {
      setPages(estimatePages(measureBlocks, pageMm));
      return;
    }
    const metas: BlockMeta[] = measureBlocks.map((b, i) => ({
      height: heights[i] ?? 0,
      keepWithNext: b.keepWithNext ?? false,
      breakBefore: b.breakBefore ?? false,
    }));
    setPages(paginate(metas, pageMm * PX_PER_MM - 2));
  }, [measureBlocks, pageMm, fontsTick]);

  useEffect(() => {
    let live = true;
    void document.fonts?.ready.then(() => live && setFontsTick((t) => t + 1));
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    onPaginated?.(pages.length);
  }, [pages.length, onPaginated]);

  const classes = `rp-root ${model.theme === 'ink' ? 'rp-ink' : 'rp-paper'}`;
  const vars = `--rp-w:${paper.widthMm}mm;--rp-h:${paper.heightMm}mm;`;
  const widthMm = contentWidthMm(paper);
  const s = scale ?? 1;
  return (
    <div class={classes} style={vars} data-pages={pages.length}>
      <div class="rp-measure" ref={measureRef} style={`width:${widthMm}mm`} aria-hidden="true">
        {measureBlocks.map((b) => (
          <div class="rp-b" key={b.id}>
            {b.node}
          </div>
        ))}
      </div>
      <div class="rp-pages">
        {pages.map((indices, n) => {
          const page = (
            <PageView
              model={model}
              blocks={pageBlocks}
              indices={indices}
              number={n + 1}
              total={pages.length}
            />
          );
          return s === 1 ? (
            <div class="rp-slot" key={n}>
              {page}
            </div>
          ) : (
            <div
              class="rp-slot"
              key={n}
              style={`width:${paper.widthMm * s}mm;height:${paper.heightMm * s}mm`}
            >
              <div style={`transform:scale(${s});transform-origin:0 0;width:${paper.widthMm}mm`}>
                {page}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Page geometry for tests and callers. */
export const REPORT_PAGE_MM = PAGE_MM;
