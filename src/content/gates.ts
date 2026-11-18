import { hexagramName } from './hexagrams';
import type { GateContent } from './schema';

/** [number, name, keynote, summary] */
type GateSeed = readonly [number, string, string, string];

const SEEDS: readonly GateSeed[] = [
  [
    1,
    'The Creative',
    'Creative self-expression',
    'The urge to express something distinctly your own. It is less about one particular skill than about the personal signature on whatever you make.',
  ],
  [
    2,
    'The Receptive',
    'Inner sense of direction',
    'A quiet sense of where life is heading. It acts like a compass that supports others by staying steady.',
  ],
  [
    3,
    'Ordering',
    'Order emerging from chaos',
    'The capacity to make sense of confusion at the start of something new. It often appears as a first awkward step that turns out to be original.',
  ],
  [
    4,
    'Formulization',
    'Answers that work in practice',
    'A mind that wants to answer questions with a formula that holds up. It tends to keep asking why until an explanation makes sense.',
  ],
  [
    5,
    'Fixed Rhythms',
    'Natural timing and routine',
    "A feel for the body's own rhythms and for patience. It tends to do best with habits that fit its natural timing.",
  ],
  [
    6,
    'Friction',
    'Emotional boundaries and intimacy',
    'Where closeness meets friction. It regulates how much intimacy gets let in, often by testing and then clearing the air.',
  ],
  [
    7,
    'The Role of the Self',
    'Guidance and leadership',
    'Interest in who should lead and how a group finds direction. It favors leadership that serves the many rather than personal power.',
  ],
  [
    8,
    'Contribution',
    'A distinctive personal contribution',
    'The need to offer something unmistakably yours and to be seen for it. Personal style becomes a form of contribution.',
  ],
  [
    9,
    'Focus',
    'Concentrating on the details',
    'The ability to narrow attention and work through the details of one thing. Small, steady effort tends to add up here.',
  ],
  [
    10,
    'Behavior of the Self',
    'Loving how you live',
    'How you carry yourself through daily life. Self-acceptance in ordinary behavior is the central theme.',
  ],
  [
    11,
    'Ideas',
    'A stream of ideas and images',
    'A flow of ideas, images and possibilities, often more about imagining than doing. They tend to want an audience.',
  ],
  [
    12,
    'Caution',
    'Careful, selective expression',
    'A mood-sensitive voice that speaks when the moment feels right. When it does speak, it can carry a lot of weight.',
  ],
  [
    13,
    'The Listener',
    'Listening and keeping stories',
    "A deep listener who gathers other people's experiences. It tends to hold the memory of what has been shared.",
  ],
  [
    14,
    'Power Skills',
    'Driven, skillful energy',
    'Energy and aptitude pointed at work that feels worthwhile. It is often linked to the resources that fuel the effort.',
  ],
  [
    15,
    'Extremes',
    'Embracing human variety',
    'Comfort with a wide range of rhythms and behaviors, including extreme ones. It tends to accept people as they are.',
  ],
  [
    16,
    'Skills',
    'Mastery through practice',
    'Enthusiasm for building skill through repetition. Confidence tends to grow with practice and openness to learning.',
  ],
  [
    17,
    'Opinions',
    'Forming views and patterns',
    'The drive to form opinions about what is going on. These views offer perspective and tend to improve when tested.',
  ],
  [
    18,
    'Correction',
    'Spotting what could improve',
    'A critical eye for what is out of order. It lands best when offered with care for the person receiving it.',
  ],
  [
    19,
    'Wanting',
    'Sensitivity to needs',
    "Awareness of needs, both your own and other people's. It shapes how close or dependent you feel in relationships.",
  ],
  [
    20,
    'The Now',
    'Awareness in the present',
    'Presence and spontaneous expression of what is happening right now. It speaks from immediate awareness rather than from a plan.',
  ],
  [
    21,
    'The Hunter/Huntress',
    'Taking charge of resources',
    'The drive to manage resources and territory and keep things in order. It tends to want autonomy over its own domain.',
  ],
  [
    22,
    'Openness',
    'Emotional grace and receptivity',
    'An emotional charm that others are drawn to. It tends to work best when you wait for a good moment to engage.',
  ],
  [
    23,
    'Assimilation',
    'Explaining an unusual insight',
    'The ability to put a new insight into simple words. It translates the unfamiliar into something others can follow.',
  ],
  [
    24,
    'Rationalization',
    'Mulling things over',
    'A mind that revisits an idea in cycles until it makes sense. Going over the same thought again often leads to a fresh view.',
  ],
  [
    25,
    'Spirit of the Self',
    'Innocent, universal love',
    'An open, trusting kind of love that is not tied to specific people. It meets life with a willingness to be surprised.',
  ],
  [
    26,
    'The Egoist',
    'Persuasion and presentation',
    'A talent for presenting ideas and making a case for them. Memory and ambition both play a part.',
  ],
  [
    27,
    'Caring',
    'Nurturing and responsibility',
    'A pull to look after others and meet their needs. It tends to set the standard for what caring looks like.',
  ],
  [
    28,
    'The Game Player',
    'The search for a meaningful life',
    'A willingness to take risks to find a life worth living. It tends to test purpose through struggle.',
  ],
  [
    29,
    'Perseverance',
    'Commitment to follow through',
    'The willingness to say yes and see an experience through. It learns by staying with something.',
  ],
  [
    30,
    'Recognition of Feelings',
    'Desire and the wish to feel',
    'An intense longing for experience and the feelings that come with it. It tends to move in cycles of hope and fulfillment.',
  ],
  [
    31,
    'Influence',
    'Leading through the voice',
    'A voice that influences when others invite it to lead. It works best when its direction is recognized and asked for.',
  ],
  [
    32,
    'Continuity',
    'Sensing what will last',
    'An instinct for what is worth continuing. It evaluates what deserves long-term investment.',
  ],
  [
    33,
    'Privacy',
    'Retreat and reflection',
    'The need to withdraw and reflect before sharing an experience. It turns what happened into a story worth telling.',
  ],
  [
    34,
    'Power',
    'Raw, available life-force',
    'Strong, self-directed energy. It tends to be most satisfying when spent on what feels right.',
  ],
  [
    35,
    'Change',
    'Hunger for new experience',
    'An appetite for new experiences and progress. It tends to seek change and then reflect on what it taught.',
  ],
  [
    36,
    'Crisis',
    'Learning through intense experience',
    'A pull toward emotionally intense, unfamiliar experience. Turbulent periods can build resilience and compassion.',
  ],
  [
    37,
    'Friendship',
    'Bonds, family and community',
    'Loyalty and care that make communities and families work. It tends to value fair agreements and friendship.',
  ],
  [
    38,
    'The Fighter',
    'Fighting for what matters',
    'The urge to struggle for something that feels meaningful. It tends to resist giving up on a purpose.',
  ],
  [
    39,
    'Provocation',
    'Provoking a response',
    'A knack for stirring others up to reveal what is underneath. It tests the mood to find out what is really there.',
  ],
  [
    40,
    'Aloneness',
    'Willpower, work and rest',
    'Willpower paired with a need for rest. It tends to give effort for others in exchange for recognition and time apart.',
  ],
  [
    41,
    'Contraction',
    'The spark of a new experience',
    'The desire to begin a new cycle of experience, fueled by imagination. It tends to picture possibilities before they exist.',
  ],
  [
    42,
    'Growth',
    'Completing cycles',
    'The drive to finish what was started and grow from it. It tends to find a natural ending.',
  ],
  [
    43,
    'Insight',
    'Sudden inner knowing',
    'Knowing that arrives from within, often unexpectedly. It is personal and tends to need the right moment to be shared.',
  ],
  [
    44,
    'Alertness',
    'Sensing patterns from the past',
    'An instinct for patterns that echo what has worked or failed before. It is a quick read of how the past may shape the present.',
  ],
  [
    45,
    'The Gatherer',
    'Gathering people and resources',
    'The ability to bring people together and share out resources. It is linked to leadership, tradition and community.',
  ],
  [
    46,
    'Determination of the Self',
    'Embodied presence, right place and time',
    'Embodied presence and a knack for being in the right place at the right time. It treats the body as a source of success.',
  ],
  [
    47,
    'Realization',
    'Making sense of the past',
    'A mind that works over past experience until it finally sees it clearly. It tends to wait for a sudden insight.',
  ],
  [
    48,
    'Depth',
    'Depth of skill and understanding',
    'A concern with depth and with the worry of not being good enough yet. It tends to build solid, reliable skill.',
  ],
  [
    49,
    'Principles',
    'Principles and change',
    'Sensitivity to values and what is acceptable. It tends to let go of what no longer works and renegotiate agreements.',
  ],
  [
    50,
    'Values',
    'Guarding shared values',
    'Care for the rules and values that keep a group healthy. It tends to take responsibility for the collective.',
  ],
  [
    51,
    'Shock',
    'Courage and surprise',
    'Courage that can jolt others awake. It reflects a push to be first and a reaction to sudden shock.',
  ],
  [
    52,
    'Stillness',
    'Staying still to concentrate',
    'The ability to hold still in order to focus. Stillness provides the base for concentrated energy.',
  ],
  [
    53,
    'Beginnings',
    'The pressure to start',
    'The drive to begin new things. It often needs a follow-up push to carry them through.',
  ],
  [
    54,
    'Ambition',
    'Drive to rise and succeed',
    'The aspiration to rise and achieve. It seeks recognition and material security.',
  ],
  [
    55,
    'Spirit',
    'Emotional highs and lows',
    'Emotional abundance that moves in waves. Spirit here depends on a sense of freedom and on what you choose to stay with.',
  ],
  [
    56,
    'Stimulation',
    'Stories and new experiences',
    'A taste for stimulation and for telling stories about it. It tends to share what it has seen to spark others.',
  ],
  [
    57,
    'Intuitive Insight',
    'Instant intuitive clarity',
    'A quiet in-the-moment awareness of what feels right or wrong. It tends to speak softly and once.',
  ],
  [
    58,
    'Vitality',
    'Zest and the drive to improve',
    'A joyful appetite for life and a wish to make things better. It tends to bring energy to improvement.',
  ],
  [
    59,
    'Sexuality',
    'Closeness and breaking barriers',
    'The drive for intimacy and connection. It tends to dissolve the barriers between people.',
  ],
  [
    60,
    'Limitation',
    'Accepting limits to enable change',
    'Acceptance of limits as the setting where change happens. It tends to wait for the right moment to move.',
  ],
  [
    61,
    'Mystery',
    'Curiosity about the unknowable',
    'A pressure to understand the big questions of why we are here. It leans toward inspiration more than answers.',
  ],
  [
    62,
    'Detail',
    'Naming the facts precisely',
    'A talent for precise words and facts. It tends to explain how things work in clear detail.',
  ],
  [
    63,
    'Doubt',
    'Questioning and testing',
    'Healthy doubt and a habit of asking questions. It tends to look for evidence before trusting.',
  ],
  [
    64,
    'Confusion',
    'A mind full of images',
    'A mind full of images and memories that may feel jumbled. It tends to make sense in hindsight.',
  ],
];

function build(): Record<number, GateContent> {
  const out: Record<number, GateContent> = {};
  for (const [number, name, keynote, summary] of SEEDS) {
    out[number] = { number, name, iching: hexagramName(number), keynote, summary };
  }
  return out;
}

/** Content for all 64 gates, keyed by gate number. */
export const GATES: Readonly<Record<number, GateContent>> = build();
