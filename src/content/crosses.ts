import type { Chart } from '@/types';
import type {
  CrossAngle,
  CrossAngleContent,
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
      'Often described as a personal path: life tends to center on your own growth and on the people who happen to be in your orbit. The pull is usually inward first, then outward.',
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
      'Often described as a transpersonal path: life tends to be shaped through other people and a wider network, with your own growth happening along the way. The pull is usually outward.',
    profiles: ['4/6', '5/1', '5/2', '6/2', '6/3'],
  },
};

/**
 * Traditional cross names (the part after "Cross of"), keyed
 * `<angle>|<personality Sun gate>`. All 192 were checked against two
 * independent published tables (manifestinghumandesign.com and
 * thehumandesign.com), and the gate sets against the wheel in the engine.
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
