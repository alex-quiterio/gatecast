import type {
  Activation,
  BirthInput,
  CenterName,
  Chart,
  ChartType,
  GateSource,
  PlanetName,
} from '@/types';
import { PLANET_NAMES } from '@/types';
import { analyzeGates, definitionName, determineAuthority, determineType } from './bodygraph';
import { centerOfGate } from './data';
import { bodyLongitudes, designMoment } from './ephemeris';
import { gateAt } from './gates';
import { birthToUtcDate } from './timezone';
import { validateBirthInput } from './validate';

const STRATEGIES: Record<ChartType, string> = {
  Generator: 'To respond',
  'Manifesting Generator': 'To respond, then inform',
  Manifestor: 'To inform before you act',
  Projector: 'Wait for the invitation',
  Reflector: 'Wait a lunar cycle before deciding',
};

const NOT_SELF_THEMES: Record<ChartType, string> = {
  Generator: 'Frustration',
  'Manifesting Generator': 'Frustration and Anger',
  Manifestor: 'Anger',
  Projector: 'Bitterness',
  Reflector: 'Disappointment',
};

function activations(date: Date): Activation[] {
  const longitudes = bodyLongitudes(date);
  return PLANET_NAMES.map((planet: PlanetName) => {
    const longitude = longitudes[planet];
    const position = gateAt(longitude);
    const center: CenterName = centerOfGate(position.gate);
    return { planet, longitude, ...position, center };
  });
}

function sunAndEarth(set: Activation[]): { sun: Activation; earth: Activation } {
  const sun = set.find((a) => a.planet === 'Sun');
  const earth = set.find((a) => a.planet === 'Earth');
  if (!sun || !earth) throw new Error('Activation set is missing the Sun or Earth');
  return { sun, earth };
}

/**
 * Computes a full Human Design chart: Personality at the birth moment,
 * Design at the moment the Sun stood 88 degrees of arc earlier, then type,
 * strategy, authority, profile, definition, channels, hanging gates and the
 * Incarnation Cross gates.
 *
 * @throws Error with a readable message (all problems joined) on invalid input.
 */
export function computeChart(input: BirthInput): Chart {
  const problems = validateBirthInput(input);
  if (problems.length > 0) throw new Error(`Invalid birth data: ${problems.join(' ')}`);

  const birth = birthToUtcDate(input);
  const design = designMoment(birth);
  const personality = activations(birth);
  const designSet = activations(design);

  const graph = analyzeGates([...personality, ...designSet].map((a) => a.gate));
  const type = determineType(graph);
  const authority = determineAuthority(graph, type);

  const p = sunAndEarth(personality);
  const d = sunAndEarth(designSet);

  const personalityGates = new Set(personality.map((a) => a.gate));
  const designGates = new Set(designSet.map((a) => a.gate));
  const gateSources: Record<number, GateSource> = {};
  for (const gate of graph.activeGates) {
    const inP = personalityGates.has(gate);
    const inD = designGates.has(gate);
    gateSources[gate] = inP && inD ? 'both' : inP ? 'personality' : 'design';
  }

  return {
    input,
    birthUtc: birth.toISOString(),
    designUtc: design.toISOString(),
    personality,
    design: designSet,
    type,
    strategy: STRATEGIES[type],
    notSelfTheme: NOT_SELF_THEMES[type],
    authority,
    profile: `${p.sun.line}/${d.sun.line}`,
    definition: definitionName(graph.components.length),
    components: graph.components,
    definedCenters: graph.definedCenters,
    openCenters: graph.openCenters,
    channels: graph.channels,
    activeGates: graph.activeGates,
    hangingGates: graph.hangingGates,
    gateSources,
    crossGates: {
      personalitySun: p.sun.gate,
      personalityEarth: p.earth.gate,
      designSun: d.sun.gate,
      designEarth: d.earth.gate,
    },
  };
}
