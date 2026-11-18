import type { ChartType } from '@/types';
import type { TypeContent } from './schema';

/** Content for the five Human Design types. */
export const TYPES: Readonly<Record<ChartType, TypeContent>> = {
  Generator: {
    tagline: 'Sustained energy that builds through response',
    summary:
      'Generators carry a renewable supply of life-force and tend to be happiest when they put it into work they love. They often find direction by responding to what life offers rather than by starting from scratch.',
    strategy: 'To respond',
    notSelfTheme: 'Frustration',
    signature: 'Satisfaction',
    aura: 'Open and enveloping: draws things in and invites engagement.',
    share: '~37%',
    advice: [
      'Notice what you feel drawn to when something is put in front of you.',
      'Choose work and projects that leave you feeling satisfied at the end of the day.',
      'Rest fully when your energy is spent, before frustration builds.',
    ],
  },
  'Manifesting Generator': {
    tagline: 'Fast-moving, multi-passionate energy',
    summary:
      'Manifesting Generators combine sustained life-force with a drive to act quickly. They often work in bursts, skip steps and juggle several interests at once.',
    strategy: 'To respond, then inform',
    notSelfTheme: 'Frustration and anger',
    signature: 'Satisfaction and peace',
    aura: 'Open and enveloping, with a quick, focused edge.',
    share: '~33%',
    advice: [
      'Check in with your gut response before starting something.',
      'Tell the people it affects before you move, to reduce friction.',
      'It is fine to change direction: finishing is optional if the interest has gone.',
    ],
  },
  Manifestor: {
    tagline: 'Initiators who start things in motion',
    summary:
      'Manifestors can begin things on their own and tend to have a strong independent drive. Their energy often arrives in bursts, and they do best when they keep the people around them informed.',
    strategy: 'To inform',
    notSelfTheme: 'Anger',
    signature: 'Peace',
    aura: 'Closed and repelling: a strong presence that keeps others at a distance.',
    share: '~9%',
    advice: [
      'Let the people affected know what you plan to do before you do it.',
      'Honor your need for independence and quiet stretches.',
      'Notice when anger signals a need to speak up earlier.',
    ],
  },
  Projector: {
    tagline: 'Guides who see and direct others',
    summary:
      'Projectors have a gift for seeing how people and systems work, and tend to guide rather than do most of the work themselves. They often thrive when their insight is recognized and invited, and when they pace their energy.',
    strategy: 'Wait for the invitation',
    notSelfTheme: 'Bitterness',
    signature: 'Success',
    aura: 'Focused and absorbing: studies and reads whoever they are with.',
    share: '~20%',
    advice: [
      'Share your perspective where it has been asked for and valued.',
      'Rest often, and do not measure yourself against energetic types.',
      'Invest in being recognized for your skills, not just busy.',
    ],
  },
  Reflector: {
    tagline: 'Mirrors of the community around them',
    summary:
      'Reflectors have no defined centers, so they tend to sample and reflect the energy of the people and places around them. They are often sensitive judges of whether an environment is healthy.',
    strategy: 'Wait a lunar cycle',
    notSelfTheme: 'Disappointment',
    signature: 'Surprise',
    aura: 'Resistant and sampling: takes in the surroundings and reflects them back.',
    share: '~1%',
    advice: [
      'Give big decisions time, ideally around 28 days, and talk them through.',
      'Pay attention to how places and people affect you.',
      'Spend time alone to separate your own sense from borrowed energy.',
    ],
  },
};
