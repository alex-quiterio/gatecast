import type { Chart } from '@/types';
import { CHANNELS } from './channels';
import { channelKey } from '@engine/data';
import type {
  Circuit,
  CircuitBreakdown,
  CircuitContent,
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
  },
};

export const STREAMS: Record<Stream, StreamContent> = {
  Knowing: {
    title: 'Knowing',
    circuit: 'Individual',
    summary:
      'Inner knowing that arrives without explanation: mutation, creative insight and a sense of purpose that tends to need no outside proof.',
  },
  Centering: {
    title: 'Centering',
    circuit: 'Individual',
    summary:
      'A pull toward self-direction and healing for oneself: starting things by following your own inner sense of where you are headed.',
  },
  Ego: {
    title: 'Ego',
    circuit: 'Tribal',
    summary:
      'Willpower in service of the group: commitment, resources and agreements, often about what each person gives and receives.',
  },
  Defense: {
    title: 'Defense',
    circuit: 'Tribal',
    summary:
      'Protecting the family and the community: bonding, safety and preserving what keeps the tribe going.',
  },
  Logic: {
    title: 'Logic',
    circuit: 'Collective',
    summary:
      'Understanding through patterns: testing ideas, finding what works and sharing it as dependable knowledge.',
  },
  Abstract: {
    title: 'Abstract',
    circuit: 'Collective',
    summary:
      'Sensing through experience: sharing what has been lived, felt and remembered, often as stories and feelings rather than proof.',
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
