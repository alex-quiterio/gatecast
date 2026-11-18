/** The 64 I Ching hexagram names in King Wen order (index 0 is hexagram 1). */
export const HEXAGRAM_NAMES: readonly string[] = [
  'The Creative',
  'The Receptive',
  'Difficulty at the Beginning',
  'Youthful Folly',
  'Waiting',
  'Conflict',
  'The Army',
  'Holding Together',
  'Small Taming',
  'Treading',
  'Peace',
  'Standstill',
  'Fellowship',
  'Great Possession',
  'Modesty',
  'Enthusiasm',
  'Following',
  'Work on the Decayed',
  'Approach',
  'Contemplation',
  'Biting Through',
  'Grace',
  'Splitting Apart',
  'Return',
  'Innocence',
  'Great Taming',
  'Nourishment',
  'Great Preponderance',
  'The Abysmal',
  'The Clinging',
  'Influence',
  'Duration',
  'Retreat',
  'Great Power',
  'Progress',
  'Darkening of the Light',
  'The Family',
  'Opposition',
  'Obstruction',
  'Deliverance',
  'Decrease',
  'Increase',
  'Breakthrough',
  'Coming to Meet',
  'Gathering Together',
  'Pushing Upward',
  'Oppression',
  'The Well',
  'Revolution',
  'The Cauldron',
  'The Arousing',
  'Keeping Still',
  'Development',
  'The Marrying Maiden',
  'Abundance',
  'The Wanderer',
  'The Gentle',
  'The Joyous',
  'Dispersion',
  'Limitation',
  'Inner Truth',
  'Small Preponderance',
  'After Completion',
  'Before Completion',
];

/**
 * The Unicode hexagram character for a King Wen number (1 to 64).
 * @throws RangeError when `n` is not an integer from 1 to 64.
 */
export function hexagramChar(n: number): string {
  if (!Number.isInteger(n) || n < 1 || n > 64) {
    throw new RangeError(`Hexagram number out of range: ${n}`);
  }
  return String.fromCodePoint(0x4dc0 + n - 1);
}

/**
 * The I Ching name for a King Wen number.
 * @throws RangeError when `n` is not an integer from 1 to 64.
 */
export function hexagramName(n: number): string {
  const name = Number.isInteger(n) ? HEXAGRAM_NAMES[n - 1] : undefined;
  if (name === undefined) throw new RangeError(`Hexagram number out of range: ${n}`);
  return name;
}
