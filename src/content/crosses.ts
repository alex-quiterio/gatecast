import { CROSS_DESCRIPTIONS } from './cross-descriptions';
import type { Chart } from '@/types';
import type {
  CrossAngle,
  CrossAngleContent,
  CrossDescription,
  CrossEntry,
  IncarnationCross,
  Quarter,
  QuarterContent,
} from './schema';

const QUARTER_GATES: Record<Quarter, readonly number[]> = {
  Initiation: [13, 49, 30, 55, 37, 63, 22, 36, 25, 17, 21, 51, 42, 3, 27, 24],
  Civilization: [2, 23, 8, 20, 16, 35, 45, 12, 15, 52, 39, 53, 62, 56, 31, 33],
  Duality: [7, 4, 29, 59, 40, 64, 47, 6, 46, 18, 48, 57, 32, 50, 28, 44],
  Mutation: [1, 43, 14, 34, 9, 5, 26, 11, 10, 58, 38, 54, 61, 60, 41, 19],
};

/** The four quarters of the wheel. */
export const QUARTERS: Record<Quarter, QuarterContent> = {
  Initiation: {
    title: 'Quarter of Initiation',
    theme: 'Purpose through mind',
    summary:
      'The gates of this quarter tend to be about starting things and finding a clear purpose. People here often lead with ideas, structure and an urge to get something going.',
    gates: QUARTER_GATES.Initiation,
  },
  Civilization: {
    title: 'Quarter of Civilization',
    theme: 'Purpose through form',
    summary:
      'The gates of this quarter tend to be about building, organizing and shaping the world around us. People here often care about what lasts and how things get made.',
    gates: QUARTER_GATES.Civilization,
  },
  Duality: {
    title: 'Quarter of Duality',
    theme: 'Purpose through bonding',
    summary:
      'The gates of this quarter tend to be about relationship, partnership and learning through others. People here often find meaning in connection and in how they fit with those around them.',
    gates: QUARTER_GATES.Duality,
  },
  Mutation: {
    title: 'Quarter of Mutation',
    theme: 'Purpose through transformation',
    summary:
      'The gates of this quarter tend to be about change, awareness and breaking from the old. People here often feel pulled toward shifts that alter how others see or live.',
    gates: QUARTER_GATES.Mutation,
  },
};

/** The three angles of an Incarnation Cross. */
export const CROSS_ANGLES: Record<CrossAngle, CrossAngleContent> = {
  'Right Angle': {
    title: 'Right Angle',
    summary:
      'Often described as a personal path: life tends to center on personal growth and on the people who happen to be nearby. The pull is usually inward first, then outward.',
    profiles: ['1/3', '1/4', '2/4', '2/5', '3/5', '3/6'],
  },
  Juxtaposition: {
    title: 'Juxtaposition',
    summary:
      'Often described as a fixed course: the theme is said to stay steady throughout life, with little room for variation. It is the only angle with a single profile, 4/1.',
    profiles: ['4/1'],
  },
  'Left Angle': {
    title: 'Left Angle',
    summary:
      'Often described as a transpersonal path: life tends to be shaped through other people and a wider network, with personal growth happening along the way. The pull is usually outward.',
    profiles: ['4/6', '5/1', '5/2', '6/2', '6/3'],
  },
};

/**
 * Traditional cross names (the part after "Cross of"), keyed
 * `<angle>|<personality Sun gate>`. All 192 come from one complete published
 * table (manifestinghumandesign.com, with each cross's four gates). The names
 * were cross-checked against a second, partial table (thehumandesign.com), and
 * the gate sets against the wheel and against 3,000 simulated charts in the
 * engine (see test/content/cross-entries.test.ts).
 */
export const CROSS_NAMES: Readonly<Record<string, string>> = {
  'Right Angle|1': 'the Sphinx',
  'Right Angle|2': 'the Sphinx',
  'Right Angle|3': 'Laws',
  'Right Angle|4': 'Explanation',
  'Right Angle|5': 'Consciousness',
  'Right Angle|6': 'Eden',
  'Right Angle|7': 'the Sphinx',
  'Right Angle|8': 'Contagion',
  'Right Angle|9': 'Planning',
  'Right Angle|10': 'the Vessel of Love',
  'Right Angle|11': 'Eden',
  'Right Angle|12': 'Eden',
  'Right Angle|13': 'the Sphinx',
  'Right Angle|14': 'Contagion',
  'Right Angle|15': 'the Vessel of Love',
  'Right Angle|16': 'Planning',
  'Right Angle|17': 'Service',
  'Right Angle|18': 'Service',
  'Right Angle|19': 'the Four Ways',
  'Right Angle|20': 'the Sleeping Phoenix',
  'Right Angle|21': 'Tension',
  'Right Angle|22': 'Rulership',
  'Right Angle|23': 'Explanation',
  'Right Angle|24': 'the Four Ways',
  'Right Angle|25': 'the Vessel of Love',
  'Right Angle|26': 'Rulership',
  'Right Angle|27': 'the Unexpected',
  'Right Angle|28': 'the Unexpected',
  'Right Angle|29': 'Contagion',
  'Right Angle|30': 'Contagion',
  'Right Angle|31': 'the Unexpected',
  'Right Angle|32': 'Maya',
  'Right Angle|33': 'the Four Ways',
  'Right Angle|34': 'the Sleeping Phoenix',
  'Right Angle|35': 'Consciousness',
  'Right Angle|36': 'Eden',
  'Right Angle|37': 'Planning',
  'Right Angle|38': 'Tension',
  'Right Angle|39': 'Tension',
  'Right Angle|40': 'Planning',
  'Right Angle|41': 'the Unexpected',
  'Right Angle|42': 'Maya',
  'Right Angle|43': 'Explanation',
  'Right Angle|44': 'the Four Ways',
  'Right Angle|45': 'Rulership',
  'Right Angle|46': 'the Vessel of Love',
  'Right Angle|47': 'Rulership',
  'Right Angle|48': 'Tension',
  'Right Angle|49': 'Explanation',
  'Right Angle|50': 'Laws',
  'Right Angle|51': 'Penetration',
  'Right Angle|52': 'Service',
  'Right Angle|53': 'Penetration',
  'Right Angle|54': 'Penetration',
  'Right Angle|55': 'the Sleeping Phoenix',
  'Right Angle|56': 'Laws',
  'Right Angle|57': 'Penetration',
  'Right Angle|58': 'Service',
  'Right Angle|59': 'the Sleeping Phoenix',
  'Right Angle|60': 'Laws',
  'Right Angle|61': 'Maya',
  'Right Angle|62': 'Maya',
  'Right Angle|63': 'Consciousness',
  'Right Angle|64': 'Consciousness',
  'Juxtaposition|1': 'Self-Expression',
  'Juxtaposition|2': 'the Driver',
  'Juxtaposition|3': 'Mutation',
  'Juxtaposition|4': 'Formulization',
  'Juxtaposition|5': 'Habits',
  'Juxtaposition|6': 'Conflict',
  'Juxtaposition|7': 'Interaction',
  'Juxtaposition|8': 'Contribution',
  'Juxtaposition|9': 'Focus',
  'Juxtaposition|10': 'Behavior',
  'Juxtaposition|11': 'Ideas',
  'Juxtaposition|12': 'Articulation',
  'Juxtaposition|13': 'Listening',
  'Juxtaposition|14': 'Empowering',
  'Juxtaposition|15': 'Extremes',
  'Juxtaposition|16': 'Experimentation',
  'Juxtaposition|17': 'Opinions',
  'Juxtaposition|18': 'Correction',
  'Juxtaposition|19': 'Need',
  'Juxtaposition|20': 'the Now',
  'Juxtaposition|21': 'Control',
  'Juxtaposition|22': 'Grace',
  'Juxtaposition|23': 'Assimilation',
  'Juxtaposition|24': 'Rationalization',
  'Juxtaposition|25': 'Innocence',
  'Juxtaposition|26': 'the Trickster',
  'Juxtaposition|27': 'Caring',
  'Juxtaposition|28': 'Risks',
  'Juxtaposition|29': 'Commitment',
  'Juxtaposition|30': 'Fates',
  'Juxtaposition|31': 'Influence',
  'Juxtaposition|32': 'Conservation',
  'Juxtaposition|33': 'Retreat',
  'Juxtaposition|34': 'Power',
  'Juxtaposition|35': 'Experience',
  'Juxtaposition|36': 'Crisis',
  'Juxtaposition|37': 'Bargains',
  'Juxtaposition|38': 'Opposition',
  'Juxtaposition|39': 'Provocation',
  'Juxtaposition|40': 'Denial',
  'Juxtaposition|41': 'Fantasy',
  'Juxtaposition|42': 'Completion',
  'Juxtaposition|43': 'Insight',
  'Juxtaposition|44': 'Alertness',
  'Juxtaposition|45': 'Possession',
  'Juxtaposition|46': 'Serendipity',
  'Juxtaposition|47': 'Oppression',
  'Juxtaposition|48': 'Depth',
  'Juxtaposition|49': 'Principles',
  'Juxtaposition|50': 'Values',
  'Juxtaposition|51': 'Shock',
  'Juxtaposition|52': 'Stillness',
  'Juxtaposition|53': 'Beginnings',
  'Juxtaposition|54': 'Ambition',
  'Juxtaposition|55': 'Moods',
  'Juxtaposition|56': 'Stimulation',
  'Juxtaposition|57': 'Intuition',
  'Juxtaposition|58': 'Vitality',
  'Juxtaposition|59': 'Strategy',
  'Juxtaposition|60': 'Limitation',
  'Juxtaposition|61': 'Thinking',
  'Juxtaposition|62': 'Detail',
  'Juxtaposition|63': 'Doubts',
  'Juxtaposition|64': 'Confusion',
  'Left Angle|1': 'Defiance',
  'Left Angle|2': 'Defiance',
  'Left Angle|3': 'Wishes',
  'Left Angle|4': 'Revolution',
  'Left Angle|5': 'Separation',
  'Left Angle|6': 'the Plane',
  'Left Angle|7': 'Masks',
  'Left Angle|8': 'Uncertainty',
  'Left Angle|9': 'Identification',
  'Left Angle|10': 'Prevention',
  'Left Angle|11': 'Education',
  'Left Angle|12': 'Education',
  'Left Angle|13': 'Masks',
  'Left Angle|14': 'Uncertainty',
  'Left Angle|15': 'Prevention',
  'Left Angle|16': 'Identification',
  'Left Angle|17': 'Upheaval',
  'Left Angle|18': 'Upheaval',
  'Left Angle|19': 'Refinement',
  'Left Angle|20': 'Duality',
  'Left Angle|21': 'Endeavor',
  'Left Angle|22': 'Informing',
  'Left Angle|23': 'Dedication',
  'Left Angle|24': 'Incarnation',
  'Left Angle|25': 'Healing',
  'Left Angle|26': 'Confrontation',
  'Left Angle|27': 'Alignment',
  'Left Angle|28': 'Alignment',
  'Left Angle|29': 'Industry',
  'Left Angle|30': 'Industry',
  'Left Angle|31': 'the Alpha',
  'Left Angle|32': 'Limitation',
  'Left Angle|33': 'Refinement',
  'Left Angle|34': 'Duality',
  'Left Angle|35': 'Separation',
  'Left Angle|36': 'the Plane',
  'Left Angle|37': 'Migration',
  'Left Angle|38': 'Individualism',
  'Left Angle|39': 'Individualism',
  'Left Angle|40': 'Migration',
  'Left Angle|41': 'the Alpha',
  'Left Angle|42': 'Limitation',
  'Left Angle|43': 'Dedication',
  'Left Angle|44': 'Incarnation',
  'Left Angle|45': 'Confrontation',
  'Left Angle|46': 'Healing',
  'Left Angle|47': 'Informing',
  'Left Angle|48': 'Endeavor',
  'Left Angle|49': 'Revolution',
  'Left Angle|50': 'Wishes',
  'Left Angle|51': 'the Clarion',
  'Left Angle|52': 'Demands',
  'Left Angle|53': 'Cycles',
  'Left Angle|54': 'Cycles',
  'Left Angle|55': 'Spirit',
  'Left Angle|56': 'Distraction',
  'Left Angle|57': 'the Clarion',
  'Left Angle|58': 'Demands',
  'Left Angle|59': 'Spirit',
  'Left Angle|60': 'Distraction',
  'Left Angle|61': 'Obscuration',
  'Left Angle|62': 'Obscuration',
  'Left Angle|63': 'Dominion',
  'Left Angle|64': 'Dominion',
};

/** The quarter a gate belongs to. */
export function quarterOfGate(gate: number): Quarter | undefined {
  for (const [quarter, gates] of Object.entries(QUARTER_GATES) as [Quarter, readonly number[]][]) {
    if (gates.includes(gate)) return quarter;
  }
  return undefined;
}

/** The angle of the cross for a profile such as `5/1`. */
export function crossAngleFor(profile: string): CrossAngle {
  for (const [angle, content] of Object.entries(CROSS_ANGLES) as [
    CrossAngle,
    CrossAngleContent,
  ][]) {
    if (content.profiles.includes(profile)) return angle;
  }
  return 'Right Angle';
}

/** The Incarnation Cross of a chart. */
export function incarnationCross(chart: Chart): IncarnationCross {
  const gates = chart.crossGates;
  const angle = crossAngleFor(chart.profile);
  const name = CROSS_NAMES[`${angle}|${gates.personalitySun}`];
  const set = `(${gates.personalitySun}/${gates.personalityEarth} | ${gates.designSun}/${gates.designEarth})`;
  return {
    angle,
    quarter: quarterOfGate(gates.personalitySun) ?? 'Initiation',
    name,
    title: name ? `${angle} Cross of ${name} ${set}` : `${angle} Cross ${set}`,
    gates,
  };
}

// ---------------------------------------------------------------------------
// PLACEHOLDERS for the next round: the data agent fills `CROSS_ENTRIES` (all
// 192 crosses with their four gates) and four writers fill the descriptions.
// ---------------------------------------------------------------------------

/** Key of a cross in lookup tables: `<angle>|<personality Sun gate>`. */
export function crossKey(angle: CrossAngle, sunGate: number): string {
  return `${angle}|${sunGate}`;
}

type CrossRow = readonly [CrossAngle, number, number, number, number];

/**
 * Gate sets of all 192 crosses, verified row by row against two published
 * tables and against the engine's wheel (Earth is 32 gates round the wheel
 * from the Sun; the design Sun stands 15 or 16 gates before the personality
 * Sun). Standard tables list one design pair per cross; a chart's own design
 * Sun can sit one gate off, so display the chart's gates, not these.
 */
const CROSS_ROWS: readonly CrossRow[] = [
  // Right Angle: [personality Sun, personality Earth, design Sun, design Earth]
  ['Right Angle', 1, 2, 7, 13],
  ['Right Angle', 2, 1, 13, 7],
  ['Right Angle', 3, 50, 60, 56],
  ['Right Angle', 4, 49, 23, 43],
  ['Right Angle', 5, 35, 64, 63],
  ['Right Angle', 6, 36, 12, 11],
  ['Right Angle', 7, 13, 2, 1],
  ['Right Angle', 8, 14, 30, 29],
  ['Right Angle', 9, 16, 40, 37],
  ['Right Angle', 10, 15, 46, 25],
  ['Right Angle', 11, 12, 6, 36],
  ['Right Angle', 12, 11, 36, 6],
  ['Right Angle', 13, 7, 1, 2],
  ['Right Angle', 14, 8, 29, 30],
  ['Right Angle', 15, 10, 25, 46],
  ['Right Angle', 16, 9, 37, 40],
  ['Right Angle', 17, 18, 58, 52],
  ['Right Angle', 18, 17, 52, 58],
  ['Right Angle', 19, 33, 44, 24],
  ['Right Angle', 20, 34, 55, 59],
  ['Right Angle', 21, 48, 38, 39],
  ['Right Angle', 22, 47, 26, 45],
  ['Right Angle', 23, 43, 49, 4],
  ['Right Angle', 24, 44, 19, 33],
  ['Right Angle', 25, 46, 10, 15],
  ['Right Angle', 26, 45, 47, 22],
  ['Right Angle', 27, 28, 41, 31],
  ['Right Angle', 28, 27, 31, 41],
  ['Right Angle', 29, 30, 8, 14],
  ['Right Angle', 30, 29, 14, 8],
  ['Right Angle', 31, 41, 27, 28],
  ['Right Angle', 32, 42, 62, 61],
  ['Right Angle', 33, 19, 24, 44],
  ['Right Angle', 34, 20, 59, 55],
  ['Right Angle', 35, 5, 63, 64],
  ['Right Angle', 36, 6, 11, 12],
  ['Right Angle', 37, 40, 9, 16],
  ['Right Angle', 38, 39, 48, 21],
  ['Right Angle', 39, 38, 21, 48],
  ['Right Angle', 40, 37, 16, 9],
  ['Right Angle', 41, 31, 28, 27],
  ['Right Angle', 42, 32, 61, 62],
  ['Right Angle', 43, 23, 4, 49],
  ['Right Angle', 44, 24, 33, 19],
  ['Right Angle', 45, 26, 22, 47],
  ['Right Angle', 46, 25, 15, 10],
  ['Right Angle', 47, 22, 45, 26],
  ['Right Angle', 48, 21, 39, 38],
  ['Right Angle', 49, 4, 43, 23],
  ['Right Angle', 50, 3, 56, 60],
  ['Right Angle', 51, 57, 54, 53],
  ['Right Angle', 52, 58, 17, 18],
  ['Right Angle', 53, 54, 51, 57],
  ['Right Angle', 54, 53, 57, 51],
  ['Right Angle', 55, 59, 34, 20],
  ['Right Angle', 56, 60, 3, 50],
  ['Right Angle', 57, 51, 53, 54],
  ['Right Angle', 58, 52, 18, 17],
  ['Right Angle', 59, 55, 20, 34],
  ['Right Angle', 60, 56, 50, 3],
  ['Right Angle', 61, 62, 32, 42],
  ['Right Angle', 62, 61, 42, 32],
  ['Right Angle', 63, 64, 5, 35],
  ['Right Angle', 64, 63, 35, 5],
  // Juxtaposition: [personality Sun, personality Earth, design Sun, design Earth]
  ['Juxtaposition', 1, 2, 4, 49],
  ['Juxtaposition', 2, 1, 49, 4],
  ['Juxtaposition', 3, 50, 41, 31],
  ['Juxtaposition', 4, 49, 8, 14],
  ['Juxtaposition', 5, 35, 47, 22],
  ['Juxtaposition', 6, 36, 15, 10],
  ['Juxtaposition', 7, 13, 23, 43],
  ['Juxtaposition', 8, 14, 55, 59],
  ['Juxtaposition', 9, 16, 64, 63],
  ['Juxtaposition', 10, 15, 18, 17],
  ['Juxtaposition', 11, 12, 46, 25],
  ['Juxtaposition', 12, 11, 25, 46],
  ['Juxtaposition', 13, 7, 43, 23],
  ['Juxtaposition', 14, 8, 59, 55],
  ['Juxtaposition', 15, 10, 17, 18],
  ['Juxtaposition', 16, 9, 63, 64],
  ['Juxtaposition', 17, 18, 38, 39],
  ['Juxtaposition', 18, 17, 39, 38],
  ['Juxtaposition', 19, 33, 1, 2],
  ['Juxtaposition', 20, 34, 37, 40],
  ['Juxtaposition', 21, 48, 54, 53],
  ['Juxtaposition', 22, 47, 11, 12],
  ['Juxtaposition', 23, 43, 30, 29],
  ['Juxtaposition', 24, 44, 13, 7],
  ['Juxtaposition', 25, 46, 58, 52],
  ['Juxtaposition', 26, 45, 6, 36],
  ['Juxtaposition', 27, 28, 19, 33],
  ['Juxtaposition', 28, 27, 33, 19],
  ['Juxtaposition', 29, 30, 20, 34],
  ['Juxtaposition', 30, 29, 34, 20],
  ['Juxtaposition', 31, 41, 24, 44],
  ['Juxtaposition', 32, 42, 56, 60],
  ['Juxtaposition', 33, 19, 2, 1],
  ['Juxtaposition', 34, 20, 40, 37],
  ['Juxtaposition', 35, 5, 22, 47],
  ['Juxtaposition', 36, 6, 10, 15],
  ['Juxtaposition', 37, 40, 5, 35],
  ['Juxtaposition', 38, 39, 57, 51],
  ['Juxtaposition', 39, 38, 51, 57],
  ['Juxtaposition', 40, 37, 35, 5],
  ['Juxtaposition', 41, 31, 44, 24],
  ['Juxtaposition', 42, 32, 60, 56],
  ['Juxtaposition', 43, 23, 29, 30],
  ['Juxtaposition', 44, 24, 7, 13],
  ['Juxtaposition', 45, 26, 36, 6],
  ['Juxtaposition', 46, 25, 52, 58],
  ['Juxtaposition', 47, 22, 12, 11],
  ['Juxtaposition', 48, 21, 53, 54],
  ['Juxtaposition', 49, 4, 14, 8],
  ['Juxtaposition', 50, 3, 31, 41],
  ['Juxtaposition', 51, 57, 61, 62],
  ['Juxtaposition', 52, 58, 21, 48],
  ['Juxtaposition', 53, 54, 42, 32],
  ['Juxtaposition', 54, 53, 32, 42],
  ['Juxtaposition', 55, 59, 9, 16],
  ['Juxtaposition', 56, 60, 27, 28],
  ['Juxtaposition', 57, 51, 62, 61],
  ['Juxtaposition', 58, 52, 48, 21],
  ['Juxtaposition', 59, 55, 16, 9],
  ['Juxtaposition', 60, 56, 28, 27],
  ['Juxtaposition', 61, 62, 50, 3],
  ['Juxtaposition', 62, 61, 3, 50],
  ['Juxtaposition', 63, 64, 26, 45],
  ['Juxtaposition', 64, 63, 45, 26],
  // Left Angle: [personality Sun, personality Earth, design Sun, design Earth]
  ['Left Angle', 1, 2, 4, 49],
  ['Left Angle', 2, 1, 49, 4],
  ['Left Angle', 3, 50, 41, 31],
  ['Left Angle', 4, 49, 8, 14],
  ['Left Angle', 5, 35, 47, 22],
  ['Left Angle', 6, 36, 15, 10],
  ['Left Angle', 7, 13, 23, 43],
  ['Left Angle', 8, 14, 55, 59],
  ['Left Angle', 9, 16, 64, 63],
  ['Left Angle', 10, 15, 18, 17],
  ['Left Angle', 11, 12, 46, 25],
  ['Left Angle', 12, 11, 25, 46],
  ['Left Angle', 13, 7, 43, 23],
  ['Left Angle', 14, 8, 59, 55],
  ['Left Angle', 15, 10, 17, 18],
  ['Left Angle', 16, 9, 63, 64],
  ['Left Angle', 17, 18, 38, 39],
  ['Left Angle', 18, 17, 39, 38],
  ['Left Angle', 19, 33, 1, 2],
  ['Left Angle', 20, 34, 37, 40],
  ['Left Angle', 21, 48, 54, 53],
  ['Left Angle', 22, 47, 11, 12],
  ['Left Angle', 23, 43, 30, 29],
  ['Left Angle', 24, 44, 13, 7],
  ['Left Angle', 25, 46, 58, 52],
  ['Left Angle', 26, 45, 6, 36],
  ['Left Angle', 27, 28, 19, 33],
  ['Left Angle', 28, 27, 33, 19],
  ['Left Angle', 29, 30, 20, 34],
  ['Left Angle', 30, 29, 34, 20],
  ['Left Angle', 31, 41, 24, 44],
  ['Left Angle', 32, 42, 56, 60],
  ['Left Angle', 33, 19, 2, 1],
  ['Left Angle', 34, 20, 40, 37],
  ['Left Angle', 35, 5, 22, 47],
  ['Left Angle', 36, 6, 10, 15],
  ['Left Angle', 37, 40, 5, 35],
  ['Left Angle', 38, 39, 57, 51],
  ['Left Angle', 39, 38, 51, 57],
  ['Left Angle', 40, 37, 35, 5],
  ['Left Angle', 41, 31, 44, 24],
  ['Left Angle', 42, 32, 60, 56],
  ['Left Angle', 43, 23, 29, 30],
  ['Left Angle', 44, 24, 7, 13],
  ['Left Angle', 45, 26, 36, 6],
  ['Left Angle', 46, 25, 52, 58],
  ['Left Angle', 47, 22, 12, 11],
  ['Left Angle', 48, 21, 53, 54],
  ['Left Angle', 49, 4, 14, 8],
  ['Left Angle', 50, 3, 31, 41],
  ['Left Angle', 51, 57, 61, 62],
  ['Left Angle', 52, 58, 21, 48],
  ['Left Angle', 53, 54, 42, 32],
  ['Left Angle', 54, 53, 32, 42],
  ['Left Angle', 55, 59, 9, 16],
  ['Left Angle', 56, 60, 27, 28],
  ['Left Angle', 57, 51, 62, 61],
  ['Left Angle', 58, 52, 48, 21],
  ['Left Angle', 59, 55, 16, 9],
  ['Left Angle', 60, 56, 28, 27],
  ['Left Angle', 61, 62, 50, 3],
  ['Left Angle', 62, 61, 3, 50],
  ['Left Angle', 63, 64, 26, 45],
  ['Left Angle', 64, 63, 45, 26],
];

/** All 192 crosses with their four gates, by angle then Sun gate. */
export const CROSS_ENTRIES: readonly CrossEntry[] = CROSS_ROWS.map(
  ([angle, sun, earth, designSun, designEarth]) => ({
    angle,
    sunGate: sun,
    name: CROSS_NAMES[crossKey(angle, sun)] ?? '',
    gates: {
      personalitySun: sun,
      personalityEarth: earth,
      designSun,
      designEarth,
    },
  }),
);

/** One cross by angle and personality Sun gate. */
export function crossEntry(angle: CrossAngle, sunGate: number): CrossEntry | undefined {
  return CROSS_ENTRIES.find((c) => c.angle === angle && c.sunGate === sunGate);
}

export { CROSS_DESCRIPTIONS };

/** What one cross tends to mean, or `undefined` when there is no description. */
export function crossDescription(angle: CrossAngle, sunGate: number): CrossDescription | undefined {
  return CROSS_DESCRIPTIONS[crossKey(angle, sunGate)];
}
