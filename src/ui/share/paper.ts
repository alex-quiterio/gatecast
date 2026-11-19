import type { PaperId } from './types';

/** A paper size in millimetres. */
export interface Paper {
  id: PaperId;
  label: string;
  widthMm: number;
  heightMm: number;
}

/** A4 and US Letter, portrait. */
export const PAPERS: Readonly<Record<PaperId, Paper>> = {
  a4: { id: 'a4', label: 'A4', widthMm: 210, heightMm: 297 },
  letter: { id: 'letter', label: 'US Letter', widthMm: 215.9, heightMm: 279.4 },
};

/** Page furniture, in millimetres. */
export const PAGE_MM = {
  padX: 16,
  padTop: 12,
  padBottom: 9,
  header: 11,
  footer: 17,
} as const;

/** CSS pixels per millimetre (CSS defines 96 px per inch). */
export const PX_PER_MM = 96 / 25.4;

/** Height available to content on one page, in mm. */
export function contentHeightMm(paper: Paper): number {
  return paper.heightMm - PAGE_MM.padTop - PAGE_MM.padBottom - PAGE_MM.header - PAGE_MM.footer;
}

/** Width available to content on one page, in mm. */
export function contentWidthMm(paper: Paper): number {
  return paper.widthMm - PAGE_MM.padX * 2;
}
