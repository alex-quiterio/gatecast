import type { AuthorityName } from '@/types';
import type { AuthorityContent } from './schema';

/** Content for the seven inner authorities. */
export const AUTHORITIES: Readonly<Record<AuthorityName, AuthorityContent>> = {
  Emotional: {
    title: 'Emotional Authority',
    summary:
      'Your Solar Plexus is defined, so your clarity tends to come after your feelings have moved through their highs and lows.',
    howToUse:
      'Avoid deciding in the first rush of excitement or distress. Sleep on it, notice how the choice feels over time, and look for steady clarity.',
  },
  Sacral: {
    title: 'Sacral Authority',
    summary:
      'Your gut-level response in the moment tends to show whether something has energy for you. It speaks in sounds and bodily yes or no rather than in explanations.',
    howToUse:
      'Ask yourself simple yes or no questions, ideally out loud or from a friend, and notice your immediate reaction before the mind weighs in.',
  },
  Splenic: {
    title: 'Splenic Authority',
    summary:
      'A quiet, instant instinct about what is right for you in this moment. It speaks once, softly, and does not repeat itself.',
    howToUse:
      'Notice subtle first impressions and act on them when they arise. Slowing down can help you hear it, because it is easily drowned out by overthinking.',
  },
  Ego: {
    title: 'Ego Authority',
    summary:
      'Your Heart center is defined and connected to decision-making, so what you truly want and are willing to commit to is a guide.',
    howToUse:
      'Ask what you really want and whether you have the willpower to back it. Say it aloud and promise only what you can keep.',
  },
  'Self-Projected': {
    title: 'Self-Projected Authority',
    summary:
      'Your sense of self connects to your voice, so you tend to find clarity by hearing yourself speak.',
    howToUse:
      'Talk it through with someone you trust, not to get advice but to hear what you say. Notice which words feel true to you.',
  },
  Mental: {
    title: 'Mental Authority',
    summary:
      'There is no inner emotional, sacral or intuitive authority, so clarity tends to come through conversation rather than from within the body. It is also called the outer authority.',
    howToUse:
      'Talk your options through with several trusted people in settings that feel right, and listen for what becomes clear as you speak.',
  },
  Lunar: {
    title: 'Lunar Authority',
    summary:
      "With no defined centers, a Reflector's clarity tends to emerge over a full lunar cycle, as the moon passes through all the gates.",
    howToUse:
      'Take about 28 days for big decisions. Talk it through, note how you feel across the cycle, and watch for what stays consistent.',
  },
};
