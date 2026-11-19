import type { CrossDescription } from '@content/schema';
import { CROSS_DESCRIPTIONS_01_16 } from './descriptions-01-16';
import { CROSS_DESCRIPTIONS_17_32 } from './descriptions-17-32';
import { CROSS_DESCRIPTIONS_33_48 } from './descriptions-33-48';
import { CROSS_DESCRIPTIONS_49_64 } from './descriptions-49-64';

/** What each of the 192 Incarnation Crosses tends to mean, keyed `<angle>|<personality Sun gate>`. */
export const CROSS_DESCRIPTIONS: Readonly<Record<string, CrossDescription>> = {
  ...CROSS_DESCRIPTIONS_01_16,
  ...CROSS_DESCRIPTIONS_17_32,
  ...CROSS_DESCRIPTIONS_33_48,
  ...CROSS_DESCRIPTIONS_49_64,
};
