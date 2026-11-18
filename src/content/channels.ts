import { CHANNEL_LIST, MOTOR_CENTERS, channelKey } from '@engine/data';
import type { ChannelInfo } from '@/types';
import type { ChannelContent, ChannelType, Circuit, Stream } from './schema';

/** [gateA, gateB, name, circuit, stream or '' (Integration has none), summary] */
type ChannelSeed = readonly [number, number, string, Circuit, Stream | '', string];

const SEEDS: readonly ChannelSeed[] = [
  [
    1,
    8,
    'Inspiration',
    'Individual',
    'Knowing',
    'A creative role model who inspires others by living and expressing in a personal way.',
  ],
  [
    2,
    14,
    'The Beat',
    'Individual',
    'Knowing',
    'A steady inner direction paired with energy for meaningful work, like keeping a beat others can follow.',
  ],
  [
    3,
    60,
    'Mutation',
    'Individual',
    'Knowing',
    'Energy that pulses in cycles and brings sudden, original change once its timing arrives.',
  ],
  [
    4,
    63,
    'Logic',
    'Collective',
    'Logic',
    'A questioning mind that looks for patterns and proof, trying to turn doubt into dependable answers.',
  ],
  [
    5,
    15,
    'Rhythm',
    'Collective',
    'Logic',
    "A deep sense of natural flow that tends to thrive on routine and stay in step with life's cycles.",
  ],
  [
    6,
    59,
    'Intimacy',
    'Tribal',
    'Defense',
    'Emotional and physical closeness that grows by lowering barriers and letting bonds form over time.',
  ],
  [
    7,
    31,
    'The Alpha',
    'Collective',
    'Logic',
    'Leadership expressed through the voice, working best when a group invites it to guide.',
  ],
  [
    9,
    52,
    'Concentration',
    'Collective',
    'Logic',
    'The ability to hold still and focus on details for long stretches, giving energy to a single task.',
  ],
  [
    10,
    20,
    'Awakening',
    'Integration',
    '',
    'Being awake to the present and expressing who you are as it happens, with a commitment to authenticity.',
  ],
  [
    10,
    34,
    'Exploration',
    'Individual',
    'Centering',
    'A strong drive to follow your own path, learning about life by acting on what feels right.',
  ],
  [
    10,
    57,
    'Perfected Form',
    'Integration',
    '',
    'A refined sense of how to live well, guided by instinct and a wish to survive and thrive in your own way.',
  ],
  [
    11,
    56,
    'Curiosity',
    'Collective',
    'Abstract',
    'A search for new ideas and experiences, shared through stories that inspire and entertain.',
  ],
  [
    12,
    22,
    'Openness',
    'Individual',
    'Knowing',
    'A mood-dependent voice with emotional grace, expressing itself best when the feeling is right.',
  ],
  [
    13,
    33,
    'The Prodigal',
    'Collective',
    'Abstract',
    'Listening and reflecting on experience, then sharing what was learned from the past as a guide.',
  ],
  [
    16,
    48,
    'The Wavelength',
    'Collective',
    'Logic',
    'Talent grown through practice and depth, aiming at a level of skill that others can rely on.',
  ],
  [
    17,
    62,
    'Acceptance',
    'Collective',
    'Logic',
    'An organizing mind that forms views and backs them with details, giving structure to ideas.',
  ],
  [
    18,
    58,
    'Judgment',
    'Collective',
    'Logic',
    'A drive to find what could be better and to push for improvement, fueled by zest for life.',
  ],
  [
    19,
    49,
    'Synthesis',
    'Tribal',
    'Ego',
    'Sensitivity to needs and values that shapes how people share resources and renegotiate agreements.',
  ],
  [
    20,
    34,
    'Charisma',
    'Integration',
    '',
    'Busy energy expressed in the moment, drawing attention and often needing to act rather than wait.',
  ],
  [
    20,
    57,
    'The Brainwave',
    'Individual',
    'Knowing',
    'Fast, intuitive awareness expressed in the present, sensing what is true right now.',
  ],
  [
    21,
    45,
    'Money',
    'Tribal',
    'Ego',
    'A drive to manage resources and a talent for gathering people and material support around shared aims.',
  ],
  [
    23,
    43,
    'Structuring',
    'Individual',
    'Knowing',
    'Insight that arrives suddenly and is shaped into words, sometimes ahead of what others can follow.',
  ],
  [
    24,
    61,
    'Awareness',
    'Individual',
    'Knowing',
    'A thinking mind that ponders deep questions in cycles, searching for understanding and inspiration.',
  ],
  [
    25,
    51,
    'Initiation',
    'Individual',
    'Centering',
    'Courageous, innocent energy that leaps into new experiences and shakes up the status quo.',
  ],
  [
    26,
    44,
    'Surrender',
    'Tribal',
    'Ego',
    'A knack for transmitting what works, linking memory of the past to persuasion and the willingness to follow.',
  ],
  [
    27,
    50,
    'Preservation',
    'Tribal',
    'Defense',
    'Caring for others and for shared values, protecting what keeps a group nourished and stable.',
  ],
  [
    28,
    38,
    'Struggle',
    'Individual',
    'Knowing',
    'A determined drive to find purpose by wrestling with difficulty, often fighting for what matters.',
  ],
  [
    29,
    46,
    'Discovery',
    'Collective',
    'Abstract',
    'Commitment to experiences and being in the right place at the right time, learning by going through them.',
  ],
  [
    30,
    41,
    'Recognition',
    'Collective',
    'Abstract',
    'Powerful desire for new experience, driven by feelings and imagination as cycles begin.',
  ],
  [
    32,
    54,
    'Transformation',
    'Tribal',
    'Ego',
    'Ambition combined with a sense for what lasts, helping people and projects grow and move up.',
  ],
  [
    34,
    57,
    'Power',
    'Integration',
    '',
    'Strong survival instinct and energy, acting on a hunch with force and quick reflexes.',
  ],
  [
    35,
    36,
    'Transitoriness',
    'Collective',
    'Abstract',
    'A hunger for change and new experience, learning through ups and downs of emotional life.',
  ],
  [
    37,
    40,
    'Community',
    'Tribal',
    'Ego',
    'A bargain-making bond that exchanges effort and loyalty for friendship and support.',
  ],
  [
    39,
    55,
    'Emoting',
    'Individual',
    'Knowing',
    'Moody emotional waves that provoke and inspire, carrying creative and spirited energy.',
  ],
  [
    42,
    53,
    'Maturation',
    'Collective',
    'Abstract',
    'A cycle of beginning, growth and completion that moves life from one chapter to the next.',
  ],
  [
    47,
    64,
    'Abstraction',
    'Collective',
    'Abstract',
    'A mind that mulls over past events and images until they resolve into an understanding.',
  ],
];

/**
 * How a channel is powered, derived from the centers it joins: Generated if it
 * touches the Sacral, Manifested if another motor connects to the Throat, and
 * Projected otherwise.
 */
function channelTypeOf(info: ChannelInfo): ChannelType {
  const [a, b] = info.centers;
  if (a === 'Sacral' || b === 'Sacral') return 'Generated';
  const motorToThroat =
    (a === 'Throat' && MOTOR_CENTERS.includes(b)) || (b === 'Throat' && MOTOR_CENTERS.includes(a));
  return motorToThroat ? 'Manifested' : 'Projected';
}

function build(): Record<string, ChannelContent> {
  const out: Record<string, ChannelContent> = {};
  for (const [a, b, name, circuit, stream, summary] of SEEDS) {
    const key = channelKey(a, b);
    const info = CHANNEL_LIST.find((c) => channelKey(...c.gates) === key);
    if (info === undefined) throw new Error(`Channel ${key} is not in CHANNEL_LIST`);
    const base = { name, summary, circuit, channelType: channelTypeOf(info) };
    out[key] = stream === '' ? base : { ...base, stream };
  }
  return out;
}

/** Content for all 36 channels, keyed like `20-34` (see `channelKey`). */
export const CHANNELS: Readonly<Record<string, ChannelContent>> = build();
