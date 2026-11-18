import type { AuthorityName, CenterName, ChannelInfo, ChartType, DefinitionName } from '@/types';
import { CENTER_NAMES } from '@/types';
import { CHANNEL_LIST, MOTOR_CENTERS } from './data';

/** The result of running a set of active gates through the BodyGraph rules. */
export interface BodyGraph {
  /** Active gates, unique, ascending. */
  activeGates: number[];
  /** Complete channels, in `CHANNEL_LIST` order (sorted by lowest gate). */
  channels: ChannelInfo[];
  definedCenters: CenterName[];
  openCenters: CenterName[];
  /** Groups of connected defined centers, in `CENTER_NAMES` order. */
  components: CenterName[][];
  /** Active gates that belong to no complete channel, ascending. */
  hangingGates: number[];
}

/**
 * Works out complete channels, defined and open centers, connected components
 * and hanging gates from a set of active gates (duplicates are ignored).
 * Pure: works equally for one chart, or for the union of two (a composite).
 */
export function analyzeGates(gates: Iterable<number>): BodyGraph {
  const activeGates = [...new Set(gates)].sort((a, b) => a - b);
  const active = new Set(activeGates);

  const channels = CHANNEL_LIST.filter(({ gates: [a, b] }) => active.has(a) && active.has(b));
  const defined = new Set<CenterName>(channels.flatMap((c) => c.centers));
  const definedCenters = CENTER_NAMES.filter((c) => defined.has(c));
  const openCenters = CENTER_NAMES.filter((c) => !defined.has(c));

  const adjacency = new Map<CenterName, CenterName[]>();
  for (const {
    centers: [a, b],
  } of channels) {
    adjacency.set(a, [...(adjacency.get(a) ?? []), b]);
    adjacency.set(b, [...(adjacency.get(b) ?? []), a]);
  }
  const seen = new Set<CenterName>();
  const components: CenterName[][] = [];
  for (const start of definedCenters) {
    if (seen.has(start)) continue;
    const group = new Set<CenterName>();
    const stack: CenterName[] = [start];
    for (let node = stack.pop(); node !== undefined; node = stack.pop()) {
      if (group.has(node)) continue;
      group.add(node);
      stack.push(...(adjacency.get(node) ?? []));
    }
    for (const c of group) seen.add(c);
    components.push(CENTER_NAMES.filter((c) => group.has(c)));
  }

  const inChannel = new Set(channels.flatMap((c) => c.gates));
  const hangingGates = activeGates.filter((g) => !inChannel.has(g));
  return { activeGates, channels, definedCenters, openCenters, components, hangingGates };
}

/** Definition name from the number of connected components (4 or more caps at Quadruple). */
export function definitionName(componentCount: number): DefinitionName {
  if (componentCount <= 0) return 'No Definition';
  if (componentCount === 1) return 'Single Definition';
  if (componentCount === 2) return 'Split Definition';
  if (componentCount === 3) return 'Triple Split Definition';
  return 'Quadruple Split Definition';
}

/** True when a defined motor shares a connected component with a defined Throat. */
export function motorConnectedToThroat(graph: BodyGraph): boolean {
  const group = graph.components.find((c) => c.includes('Throat'));
  return group !== undefined && MOTOR_CENTERS.some((m) => group.includes(m));
}

/**
 * Type: Reflector with no defined centers; with a defined Sacral, Manifesting
 * Generator if a motor connects to the Throat else Generator; without Sacral,
 * Manifestor if a motor connects to the Throat else Projector.
 */
export function determineType(graph: BodyGraph): ChartType {
  if (graph.definedCenters.length === 0) return 'Reflector';
  const connected = motorConnectedToThroat(graph);
  if (graph.definedCenters.includes('Sacral')) {
    return connected ? 'Manifesting Generator' : 'Generator';
  }
  return connected ? 'Manifestor' : 'Projector';
}

/**
 * Inner authority by priority: Solar Plexus (Emotional), Sacral, Spleen
 * (Splenic), Heart (Ego), G (Self-Projected); Reflectors are Lunar; anything
 * left (only Head, Ajna and Throat defined) is Mental.
 */
export function determineAuthority(graph: BodyGraph, type: ChartType): AuthorityName {
  const has = (c: CenterName): boolean => graph.definedCenters.includes(c);
  if (has('SolarPlexus')) return 'Emotional';
  if (has('Sacral')) return 'Sacral';
  if (has('Spleen')) return 'Splenic';
  if (has('Heart')) return 'Ego';
  if (has('G')) return 'Self-Projected';
  if (type === 'Reflector') return 'Lunar';
  return 'Mental';
}
