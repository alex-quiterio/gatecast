import type { ComponentProps } from 'preact';

/** Names of the built-in icons. */
export type IconName =
  | 'search'
  | 'chart'
  | 'compare'
  | 'book'
  | 'info'
  | 'share'
  | 'download'
  | 'image'
  | 'copy'
  | 'print'
  | 'sun'
  | 'moon'
  | 'close'
  | 'chevron'
  | 'plus'
  | 'minus'
  | 'trash'
  | 'keyboard'
  | 'save'
  | 'fit'
  | 'sidebar'
  | 'check'
  | 'more';

/** 16x16 stroke paths, drawn with `currentColor`. */
const PATHS: Record<IconName, string> = {
  search: 'M7 12A5 5 0 1 0 7 2a5 5 0 0 0 0 10Zm3.6-1.4L14 14',
  chart: 'M8 1.5v13M3 4.5h10M3 11.5h10M5 7l3 3 3-3',
  compare: 'M6 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm4 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
  book: 'M3 2.5h7a2 2 0 0 1 2 2v9H5a2 2 0 0 1-2-2v-9Zm0 9a2 2 0 0 1 2-2h7',
  info: 'M8 7v4.2M8 4.6v.1M8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12Z',
  share:
    'M5.5 9.5l5-3M5.5 6.5l5 3M4 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm8-4a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm0 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  download: 'M8 2v8m0 0L5 7m3 3 3-3M3 13h10',
  image: 'M2.5 3h11v10h-11V3Zm0 8 3.5-3.5 3 3 2-2 2.5 2.5M10.5 6.2v.1',
  copy: 'M5.5 5.5h7v8h-7v-8ZM3.5 10.5v-8h7',
  print: 'M4.5 6V2.5h7V6M4.5 11.5h-2v-5h11v5h-2M4.5 9.5h7v4h-7v-4Z',
  sun: 'M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0-9.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1',
  moon: 'M13.5 9.5A5.5 5.5 0 0 1 6.5 2.5a5.5 5.5 0 1 0 7 7Z',
  close: 'M3.5 3.5l9 9m0-9l-9 9',
  chevron: 'M4.5 6.5L8 10l3.5-3.5',
  plus: 'M8 3v10M3 8h10',
  minus: 'M3 8h10',
  trash: 'M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5M7 7v4M9 7v4',
  keyboard: 'M1.5 4.5h13v7h-13v-7Zm3 2h.1m2.4 0h.1m2.4 0h.1m2.4 0h.1M5 9.5h6',
  save: 'M3 2.5h8l2 2v9H3v-11Zm2.5 0v3.5h4V2.5M5.5 13.5v-4h5v4',
  fit: 'M2.5 6V2.5H6m4 0h3.5V6m0 4v3.5H10m-4 0H2.5V10',
  sidebar: 'M2.5 3h11v10h-11V3Zm4 0v10',
  check: 'M3.5 8.5l3 3 6-7',
  more: 'M3.5 8h.1M8 8h.1M12.5 8h.1',
};

/** Props of {@link Icon}. */
export interface IconProps extends Omit<ComponentProps<'svg'>, 'name' | 'size'> {
  name: IconName;
  size?: number;
}

/** A small inline stroke icon (decorative: `aria-hidden`). Colour follows the text. */
export function Icon({ name, size = 16, ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
      class="icon"
      {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
