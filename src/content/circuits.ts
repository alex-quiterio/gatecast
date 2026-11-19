import type { Chart } from '@/types';
import { CHANNELS } from './channels';
import { channelKey } from '@engine/data';
import type {
  Circuit,
  CircuitBreakdown,
  CircuitContent,
  CircuitPairContent,
  CircuitShare,
  Stream,
  StreamContent,
  StreamShare,
} from './schema';

/** Circuits in display order. */
export const CIRCUIT_ORDER: readonly Circuit[] = [
  'Individual',
  'Tribal',
  'Collective',
  'Integration',
];
/** Streams in display order. */
export const STREAM_ORDER: readonly Stream[] = [
  'Knowing',
  'Centering',
  'Ego',
  'Defense',
  'Logic',
  'Abstract',
];

/** Which circuit each stream belongs to. */
export const STREAM_CIRCUIT: Readonly<Record<Stream, Circuit>> = {
  Knowing: 'Individual',
  Centering: 'Individual',
  Ego: 'Tribal',
  Defense: 'Tribal',
  Logic: 'Collective',
  Abstract: 'Collective',
};

export const CIRCUITS: Record<Circuit, CircuitContent> = {
  Individual: {
    title: 'Individual',
    tagline: 'Empowering the one who is different',
    summary:
      'A circuit about being an original: mutation, inner knowing and a path that is not meant to be copied. Its energy tends to pulse and cannot be forced to a schedule. Others often feel it as inspiring, and sometimes as hard to follow.',
    theme:
      'Living it tends to mean following your own timing and expressing in a way that is uniquely yours. The common stress is feeling odd or misunderstood, or trying to explain what is mostly felt rather than reasoned. Teachers draw the lines between Knowing, Centering and Integration a little differently; Gatecast follows a widely used division with four Integration channels.',
    streams: ['Knowing', 'Centering'],
    channelCount: 11,
    strong:
      'When Individual channels make up most of a chart, energy tends to arrive in pulses, and insights often come without a clear source. Life may revolve around following an inner sense and expressing it in a way that is hard to copy.',
    absent:
      'Having no Individual channels is very common and not a lack. You may notice people with a lot of it seem to act on timing and insights that come out of nowhere. Giving them room, rather than asking for a reason, often helps.',
    relating:
      'People with a lot of Individual energy tend to connect through authenticity: they often value being met as they are and may need time alone to recharge. Closeness may grow best when there is space and no pressure to explain.',
    experiments: [
      'Notice one moment this week when a sudden knowing arrives, and jot it down before explaining it.',
      'Once, make a small decision at your own pace and see whether the timing feels different.',
      'Share one unusual idea with someone you trust and notice how you feel before they answer.',
    ],
  },
  Tribal: {
    title: 'Tribal',
    tagline: 'Support, loyalty and looking after our own',
    summary:
      'A circuit about community: family, partnership, resources and mutual care. Its energy tends to be about deals, loyalty and what we owe each other. It often shows up as a steady wish to protect and provide.',
    theme:
      'Living it tends to mean caring about commitments, belonging and fair exchange. The common stress is conditional support, keeping score, or feeling responsible for everyone in the circle.',
    streams: ['Ego', 'Defense'],
    channelCount: 7,
    strong:
      'When Tribal channels make up most of a chart, attention tends to center on family, friends and fair exchange. Commitments, loyalty and looking after your people often shape everyday choices.',
    absent:
      'Having no Tribal channels is common and not a lack. You may notice others with a lot of it tracking favors, loyalties and who is in or out. Asking plainly what they would value can ease the guesswork.',
    relating:
      'People with a lot of Tribal energy often connect through care in practice: showing up, sharing resources and keeping promises. They may appreciate clear agreements and gestures that go both ways.',
    experiments: [
      'Notice when you offer help this week and whether you quietly expect something back.',
      'Say one agreement out loud with someone close, so both of you know what it is.',
      'Ask a friend what support would feel good to them, instead of guessing.',
    ],
  },
  Collective: {
    title: 'Collective',
    tagline: 'Sharing what has been learned',
    summary:
      'A circuit about sharing: patterns, experience and ideas offered to the wider world. Its energy tends to look for what can be tested, refined and passed on. Logic leans toward proof, Abstract toward lived experience.',
    theme:
      'Living it tends to mean learning from the past and from experience, then offering it to others. The common stress is a pressure to be useful to everyone, or an urge to share before the picture is ready.',
    streams: ['Logic', 'Abstract'],
    channelCount: 14,
    strong:
      'When Collective channels make up most of a chart, attention tends to turn toward patterns, lessons and experience that could be useful to others. Life may feel like a steady cycle of learning, testing and sharing.',
    absent:
      'Having no Collective channels is common and not a lack. You may notice people with a lot of it eager to explain, teach or tell stories, sometimes before you asked. Saying what you are curious about can focus that generosity.',
    relating:
      'People with a lot of Collective energy often connect by sharing what they have learned, through explanations or stories. They may enjoy being asked questions and hearing how their experience landed.',
    experiments: [
      'Before sharing an idea, ask whether the other person wants to hear it, and notice the reply.',
      'Write down one lesson from this week, then pick who might actually benefit from it.',
      'Notice one moment you offered advice and check whether it was wanted.',
    ],
  },
  Integration: {
    title: 'Integration',
    tagline: 'Staying true to yourself while surviving',
    summary:
      'A small set of four channels linking the Throat, G, Spleen and Sacral. It is about acting in your own way, in the moment, and staying independent. It sits alongside the Individual circuit rather than inside the three main circuits.',
    theme:
      "Living it tends to mean a strong pull to follow your own rhythm and trust what feels right in the moment. The common stress is being impatient with routines and other people's pace.",
    streams: [],
    channelCount: 4,
    strong:
      'When Integration channels stand out in a chart, a strong pull to act in your own way and in the moment tends to be present. Following your own rhythm may feel more natural than following a set routine.',
    absent:
      'Having no Integration channels is very common, since there are only four. You may notice others with them acting quickly on their own sense of what feels right. Giving them some room to move their own way can keep things easy.',
    relating:
      'People with Integration energy tend to connect through shared action more than long talks, and may appreciate partners who are flexible about pace. Independence often matters to how close they feel.',
    experiments: [
      'Notice one routine you follow only out of habit and see how it feels to adjust it.',
      'Pick one small task and let your in-the-moment sense choose when you do it.',
      'Tell someone close how you prefer to work, in one sentence.',
    ],
  },
};

export const STREAMS: Record<Stream, StreamContent> = {
  Knowing: {
    title: 'Knowing',
    circuit: 'Individual',
    summary:
      'Inner knowing that arrives without explanation: mutation, creative insight and a sense of purpose that tends to need no outside proof.',
    strong:
      'A strongly Knowing chart tends to carry quiet certainty and creative insight that arrives without steps. Others may find this intriguing, and sometimes hard to follow or explain.',
    stress:
      'The common pressure is being asked to justify a knowing that has no reasons attached. It may feel lonely when others want proof; trusting small insights first can help.',
  },
  Centering: {
    title: 'Centering',
    circuit: 'Individual',
    summary:
      'A pull toward self-direction and healing for oneself: starting things by following your own inner sense of where you are headed.',
    strong:
      'A strongly Centering chart tends to move toward self-direction: growing by following an inner sense of where you are headed and what keeps you whole.',
    stress:
      'The common pressure is feeling adrift when direction is unclear, or being pulled off course by what others expect. Returning to what feels centered for you may help.',
  },
  Ego: {
    title: 'Ego',
    circuit: 'Tribal',
    summary:
      'Willpower in service of the group: commitment, resources and agreements, often about what each person gives and receives.',
    strong:
      'A strongly Ego chart tends to bring determination in service of the group: backing commitments, negotiating fair terms and following through for people who matter to you.',
    stress:
      'The common pressure is tying a sense of worth to what you give and receive. It may show up as keeping score or feeling unseen; naming needs openly may ease it.',
  },
  Defense: {
    title: 'Defense',
    circuit: 'Tribal',
    summary:
      'Protecting the family and the community: bonding, safety and preserving what keeps the tribe going.',
    strong:
      'A strongly Defense chart tends to bring protective, bonding energy: noticing who is safe, who belongs and what keeps the group going. It may show up as loyalty and a quick read of the room.',
    stress:
      'The common pressure is wariness: sensing threat early, or finding it hard to trust new people. Letting trust build at its own pace may help.',
  },
  Logic: {
    title: 'Logic',
    circuit: 'Collective',
    summary:
      'Understanding through patterns: testing ideas, finding what works and sharing it as dependable knowledge.',
    strong:
      'A strongly Logic chart tends to look for what holds up: testing ideas, spotting patterns and sharing what works. People may come to you for clear, dependable explanations.',
    stress:
      'The common pressure is impatience with ideas that are untested, or a sense that nothing is ready to share yet. Treating a draft as a draft may help.',
  },
  Abstract: {
    title: 'Abstract',
    circuit: 'Collective',
    summary:
      'Sensing through experience: sharing what has been lived, felt and remembered, often as stories and feelings rather than proof.',
    strong:
      'A strongly Abstract chart tends to make sense of life through feeling and memory: sharing experience as stories, with an emotional wave that gives them depth.',
    stress:
      'The common pressure is emotional ups and downs while waiting for clarity, or sharing before the story has settled. Letting a feeling pass before telling it may help.',
  },
};

/** How a chart's complete channels spread across circuits and streams. */
export function circuitBreakdown(chart: Chart): CircuitBreakdown {
  const total = chart.channels.length;
  const share = (n: number): number => (total === 0 ? 0 : n / total);
  const circuits: CircuitShare[] = CIRCUIT_ORDER.map((circuit) => {
    const channels = chart.channels.filter(
      (c) => CHANNELS[channelKey(c.gates[0], c.gates[1])]?.circuit === circuit,
    );
    return { circuit, channels, share: share(channels.length) };
  });
  const streams: StreamShare[] = STREAM_ORDER.map((stream) => {
    const channels = chart.channels.filter(
      (c) => CHANNELS[channelKey(c.gates[0], c.gates[1])]?.stream === stream,
    );
    return { stream, circuit: STREAM_CIRCUIT[stream], channels, share: share(channels.length) };
  });
  const top = Math.max(...circuits.map((c) => c.channels.length));
  const leaders = circuits.filter((c) => c.channels.length === top);
  return {
    totalChannels: total,
    circuits,
    streams,
    dominant: top > 0 && leaders.length === 1 ? leaders[0]?.circuit : undefined,
  };
}

// ---------------------------------------------------------------------------
// Circuit pairs: how two people's leading circuits tend to meet.
// ---------------------------------------------------------------------------

/** Key of a pair of circuits, in display order: `Individual+Tribal`. */
export function circuitPairKey(a: Circuit, b: Circuit): string {
  const [first, second] = CIRCUIT_ORDER.indexOf(a) <= CIRCUIT_ORDER.indexOf(b) ? [a, b] : [b, a];
  return `${first}+${second}`;
}

/** How two people with these leading circuits tend to meet (all 10 pairs, including a circuit with itself). */
export const CIRCUIT_PAIRS: Readonly<Record<string, CircuitPairContent>> = {
  'Individual+Individual': {
    title: 'Two original paths meeting',
    summary:
      "Two people who each lead with Individual energy may enjoy room to be different and an easy respect for each other's timing. Misunderstandings can arise when each assumes the other's inner sense matches theirs; try saying aloud what you need before it builds.",
  },
  'Individual+Tribal': {
    title: 'Independence meets belonging',
    summary:
      'They may enjoy a mix of fresh perspective and warm loyalty. Tension tends to arise when one wants space and the other reads distance as less care; try saying what a pause means and what care looks like for each of you.',
  },
  'Individual+Collective': {
    title: 'Originality meets shared knowledge',
    summary:
      'They may enjoy trading inspiration and well-tested ideas. Misunderstandings tend to arise when one expects explanations and the other mostly senses; try asking whether the other wants ideas or just a listener.',
  },
  'Individual+Integration': {
    title: 'Two independent rhythms',
    summary:
      'They may enjoy easy freedom and spontaneous plans. Friction can arise when both move on instinct and neither mentions timing; a light check-in about plans may keep things smooth.',
  },
  'Tribal+Tribal': {
    title: 'Shared loyalty and shared expectations',
    summary:
      'They may enjoy a strong sense of team and mutual care. Misunderstandings tend to arise when both keep a quiet tally of what has been given, or expect the other to read needs; try naming agreements and thanks plainly.',
  },
  'Tribal+Collective': {
    title: 'Community meets shared learning',
    summary:
      'They may enjoy building something useful for their circle. Tension tends to arise when one puts loyalty to the group first and the other puts what is worth sharing widely first; try asking what each wants protected and what shared.',
  },
  'Tribal+Integration': {
    title: 'Belonging meets self-direction',
    summary:
      'They may enjoy warmth alongside flexibility. Misunderstandings can arise when expectations of commitment meet a wish to act in the moment; try agreeing on a few fixed points and leaving the rest open.',
  },
  'Collective+Collective': {
    title: 'Two sharers of what they know',
    summary:
      'They may enjoy a lively exchange of ideas and stories. Misunderstandings tend to arise when both want to teach at once, or when proof meets lived experience; try taking turns and asking what kind of input is wanted.',
  },
  'Collective+Integration': {
    title: 'Sharing meets acting in the moment',
    summary:
      'They may enjoy curiosity and spontaneity together. Friction tends to arise when one wants to reflect and explain before acting while the other is ready to move; try deciding together how much planning a task needs.',
  },
  'Integration+Integration': {
    title: 'Two rhythms, one shared space',
    summary:
      'They may enjoy easy independence and quick shared action. Misunderstandings can arise when each assumes the other shares their pace; a small habit of stating timing preferences may help.',
  },
};

/** The pair text for two leading circuits, or `undefined` if either is missing or there is no text. */
export function circuitPairText(
  a: Circuit | undefined,
  b: Circuit | undefined,
): CircuitPairContent | undefined {
  if (!a || !b) return undefined;
  return CIRCUIT_PAIRS[circuitPairKey(a, b)];
}
