import type { LineContent } from './schema';

/** Content for the six lines of a gate or profile. */
export const LINES: Readonly<Record<1 | 2 | 3 | 4 | 5 | 6, LineContent>> = {
  1: {
    name: 'Investigator',
    summary:
      'Seeks a solid foundation through study. Feels secure when it knows enough to stand on.',
  },
  2: {
    name: 'Hermit',
    summary:
      'Carries natural gifts that appear without effort. Needs time alone and tends to be called out by others.',
  },
  3: {
    name: 'Martyr',
    summary: 'Learns through trial and error. Adapts and finds out what works by what does not.',
  },
  4: {
    name: 'Opportunist',
    summary:
      'Builds a network and influences through relationships. Things often move through people it knows.',
  },
  5: {
    name: 'Heretic',
    summary:
      "Offers practical solutions and can carry others' expectations. Is often seen as the one who can help.",
  },
  6: {
    name: 'Role Model',
    summary:
      'Gains perspective over time and tends to lead by example. Often steps back to observe before engaging.',
  },
};
