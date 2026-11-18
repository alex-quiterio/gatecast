import type { CenterName, ChannelInfo } from '@/types';

/**
 * The 64 gates in order around the 360 degree ecliptic. The wheel starts at
 * `WHEEL_START_DEGREES` with gate 41; each gate spans `GATE_SIZE` degrees.
 */
export const GATE_WHEEL: readonly number[] = [
  41, 19, 13, 49, 30, 55, 37, 63, 22, 36, 25, 17, 21, 51, 42, 3, 27, 24, 2, 23, 8, 20, 16, 35, 45,
  12, 15, 52, 39, 53, 62, 56, 31, 33, 7, 4, 29, 59, 40, 64, 47, 6, 46, 18, 48, 57, 32, 50, 28, 44,
  1, 43, 14, 34, 9, 5, 26, 11, 10, 58, 38, 54, 61, 60,
];

/** Absolute ecliptic longitude where gate 41 begins: 2 degrees Aquarius. */
export const WHEEL_START_DEGREES = 302;
export const GATE_SIZE = 360 / 64; // 5.625
export const LINE_SIZE = GATE_SIZE / 6;
export const COLOR_SIZE = LINE_SIZE / 6;
export const TONE_SIZE = COLOR_SIZE / 6;

/** Which gates belong to which center. */
export const CENTER_GATES: Readonly<Record<CenterName, readonly number[]>> = {
  Head: [64, 61, 63],
  Ajna: [47, 24, 4, 17, 43, 11],
  Throat: [62, 23, 56, 35, 12, 45, 33, 8, 31, 20, 16],
  G: [1, 13, 25, 46, 2, 15, 10, 7],
  Heart: [21, 40, 26, 51],
  Spleen: [48, 57, 44, 50, 32, 28, 18],
  SolarPlexus: [6, 37, 22, 36, 30, 55, 49],
  Sacral: [34, 5, 14, 29, 59, 9, 3, 42, 27],
  Root: [58, 38, 54, 53, 60, 52, 19, 39, 41],
};

/** The four motors. */
export const MOTOR_CENTERS: readonly CenterName[] = ['Sacral', 'Heart', 'SolarPlexus', 'Root'];

/** The 36 channels, each joining two gates and so two centers. */
export const CHANNEL_LIST: readonly ChannelInfo[] = [
  { gates: [1, 8], centers: ['G', 'Throat'] },
  { gates: [2, 14], centers: ['G', 'Sacral'] },
  { gates: [3, 60], centers: ['Sacral', 'Root'] },
  { gates: [4, 63], centers: ['Ajna', 'Head'] },
  { gates: [5, 15], centers: ['Sacral', 'G'] },
  { gates: [6, 59], centers: ['SolarPlexus', 'Sacral'] },
  { gates: [7, 31], centers: ['G', 'Throat'] },
  { gates: [9, 52], centers: ['Sacral', 'Root'] },
  { gates: [10, 20], centers: ['G', 'Throat'] },
  { gates: [10, 34], centers: ['G', 'Sacral'] },
  { gates: [10, 57], centers: ['G', 'Spleen'] },
  { gates: [11, 56], centers: ['Ajna', 'Throat'] },
  { gates: [12, 22], centers: ['Throat', 'SolarPlexus'] },
  { gates: [13, 33], centers: ['G', 'Throat'] },
  { gates: [16, 48], centers: ['Throat', 'Spleen'] },
  { gates: [17, 62], centers: ['Ajna', 'Throat'] },
  { gates: [18, 58], centers: ['Spleen', 'Root'] },
  { gates: [19, 49], centers: ['Root', 'SolarPlexus'] },
  { gates: [20, 34], centers: ['Throat', 'Sacral'] },
  { gates: [20, 57], centers: ['Throat', 'Spleen'] },
  { gates: [21, 45], centers: ['Heart', 'Throat'] },
  { gates: [23, 43], centers: ['Throat', 'Ajna'] },
  { gates: [24, 61], centers: ['Ajna', 'Head'] },
  { gates: [25, 51], centers: ['G', 'Heart'] },
  { gates: [26, 44], centers: ['Heart', 'Spleen'] },
  { gates: [27, 50], centers: ['Sacral', 'Spleen'] },
  { gates: [28, 38], centers: ['Spleen', 'Root'] },
  { gates: [29, 46], centers: ['Sacral', 'G'] },
  { gates: [30, 41], centers: ['SolarPlexus', 'Root'] },
  { gates: [32, 54], centers: ['Spleen', 'Root'] },
  { gates: [34, 57], centers: ['Sacral', 'Spleen'] },
  { gates: [35, 36], centers: ['Throat', 'SolarPlexus'] },
  { gates: [37, 40], centers: ['SolarPlexus', 'Heart'] },
  { gates: [39, 55], centers: ['Root', 'SolarPlexus'] },
  { gates: [42, 53], centers: ['Sacral', 'Root'] },
  { gates: [47, 64], centers: ['Ajna', 'Head'] },
];

/** Key for a channel in lookup tables, e.g. `20-34`. */
export function channelKey(a: number, b: number): string {
  return `${Math.min(a, b)}-${Math.max(a, b)}`;
}

/** The center a gate belongs to. */
export function centerOfGate(gate: number): CenterName {
  for (const [center, gates] of Object.entries(CENTER_GATES) as [CenterName, readonly number[]][]) {
    if (gates.includes(gate)) return center;
  }
  throw new RangeError(`Unknown gate ${gate}`);
}
