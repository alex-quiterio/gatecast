import type { PlanetName } from '@/types';
import type { PlanetContent } from './schema';

/**
 * Content for the 13 chart bodies. Each appears twice in a chart: once for the
 * Personality (conscious) and once for the Design (unconscious).
 */
export const PLANETS: Readonly<Record<PlanetName, PlanetContent>> = {
  Sun: {
    glyph: '☉',
    label: 'Sun',
    meaning:
      'Your core identity and life force, and the gate that shapes the profile. The Personality Sun is the conscious self; the Design Sun is the unconscious.',
  },
  Earth: {
    glyph: '⊕',
    label: 'Earth',
    meaning:
      'The grounding counterpart to the Sun, and the place you stand to work with its theme. It balances the Sun gate in the Incarnation Cross.',
  },
  Moon: {
    glyph: '☽',
    label: 'Moon',
    meaning:
      'What drives you and motivates change. The Personality Moon is the conscious drive; the Design Moon works below awareness.',
  },
  NorthNode: {
    glyph: '☊',
    label: 'North Node',
    meaning:
      'The direction your environment tends to take you, and where your future may be heading. The Personality side is conscious; the Design side is the environment you are drawn to unconsciously.',
  },
  SouthNode: {
    glyph: '☋',
    label: 'South Node',
    meaning:
      'The background you come from, and what you tend to leave behind. It sits opposite the North Node and describes the past you carry.',
  },
  Mercury: {
    glyph: '☿',
    label: 'Mercury',
    meaning:
      'How you communicate, think and process information. Personality is how you consciously express yourself; Design is how your body takes in ideas.',
  },
  Venus: {
    glyph: '♀',
    label: 'Venus',
    meaning:
      'What you value and how you relate. It shows what you are drawn to and what feels harmonious, consciously (Personality) and unconsciously (Design).',
  },
  Mars: {
    glyph: '♂',
    label: 'Mars',
    meaning:
      'How you use energy and drive. It shows where you push, and where you learn through friction, consciously and unconsciously.',
  },
  Jupiter: {
    glyph: '♃',
    label: 'Jupiter',
    meaning:
      'Where you find generosity, optimism and a sense of law. It points to how you grow and what you share with others.',
  },
  Saturn: {
    glyph: '♄',
    label: 'Saturn',
    meaning:
      'Where life tests you and where discipline develops. It shows what you work at and what you learn from limits.',
  },
  Uranus: {
    glyph: '♅',
    label: 'Uranus',
    meaning:
      'Where you are unusual and drawn to the unexpected. It marks areas of originality and the urge to break from habit.',
  },
  Neptune: {
    glyph: '♆',
    label: 'Neptune',
    meaning:
      'Where you meet the unclear and idealistic. It points to imagination, subtle perception and the pull of what cannot be pinned down.',
  },
  Pluto: {
    glyph: '♇',
    label: 'Pluto',
    meaning:
      'Where deep transformation takes place. It speaks to what gets renewed over time and the truths you may have to face.',
  },
};
