import type { DynamicKind } from '@/types';
import type { DynamicContent } from './schema';

/**
 * The four ways two charts can meet in a channel. None is better or worse:
 * each is simply a different texture of relationship.
 */
export const DYNAMICS: Readonly<Record<DynamicKind, DynamicContent>> = {
  electromagnetic: {
    title: 'Electromagnetic',
    summary:
      'Each person holds one gate of a channel, and together you complete it. This often feels like a spark or pull, and the channel is active only while you are together.',
    example:
      'One person has gate 20 and the other gate 34, so together you form the channel 20-34.',
  },
  companionship: {
    title: 'Companionship',
    summary:
      'You both have the same channel complete. This tends to feel familiar and easy, like having a shared way of doing things.',
    example:
      'You both have the channel 20-34, so you share the same energy and may understand each other readily.',
  },
  dominance: {
    title: 'Dominance',
    summary:
      "One person has the complete channel and the other has neither gate. The first person's way of being tends to stand out in the pair, and the other may take it in.",
    example:
      'One person has 20-34 and the other has neither gate, so that channel colors the pair mostly from one side.',
  },
  compromise: {
    title: 'Compromise',
    summary:
      "One person has the complete channel and the other has just one of its gates. The second person's gate may feel pulled or colored by the first person's channel.",
    example:
      "One person has 20-34 and the other has gate 34 alone, so that gate takes on the other's channel energy.",
  },
};
