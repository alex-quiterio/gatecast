import type { DefinitionName } from '@/types';
import type { DefinitionContent } from './schema';

/** Content for the five definition types. */
export const DEFINITIONS: Readonly<Record<DefinitionName, DefinitionContent>> = {
  'No Definition': {
    title: 'No Definition',
    summary:
      'No center is defined, as with a Reflector. The chart has no fixed internal connection, so it tends to take on whatever is around it.',
  },
  'Single Definition': {
    title: 'Single Definition',
    summary:
      'All defined centers are connected in one group. Processing tends to feel self-contained and does not rely on others to complete it.',
  },
  'Split Definition': {
    title: 'Split Definition',
    summary:
      'Defined centers form two separate groups. You may feel drawn to people or places that bridge the gap, and processing can take a little longer.',
  },
  'Triple Split Definition': {
    title: 'Triple Split Definition',
    summary:
      'Defined centers form three separate groups. You often need a variety of people and settings to feel complete, and benefit from time before deciding.',
  },
  'Quadruple Split Definition': {
    title: 'Quadruple Split Definition',
    summary:
      'Defined centers form four separate groups. You tend to need space and a wide range of company, and may take time to feel at ease with others.',
  },
};
