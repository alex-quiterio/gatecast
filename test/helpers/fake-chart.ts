import type {
  Activation,
  CenterName,
  Chart,
  ChannelInfo,
  ComparedChannel,
  Comparison,
  DynamicKind,
  GateSource,
  PlanetName,
} from '@/types';
import { CENTER_NAMES, PLANET_NAMES } from '@/types';
import { CHANNEL_LIST, GATE_WHEEL, centerOfGate, channelKey } from '@engine';
import { GATE_SIZE, WHEEL_START_DEGREES } from '@engine/data';

export interface FakeChartOptions {
  name?: string;
  /** Gates of the conscious planets in `PLANET_NAMES` order; cycled to fill 13. */
  personality?: number[];
  /** Gates of the unconscious planets; cycled to fill 13. */
  design?: number[];
  /** Extra active gates with no planet behind them (fixtures only). */
  extraPersonality?: number[];
  extraDesign?: number[];
}

function longitudeOf(gate: number, offset: number): number {
  const index = GATE_WHEEL.indexOf(gate);
  const start = WHEEL_START_DEGREES + index * GATE_SIZE;
  return (start + GATE_SIZE * offset) % 360;
}

function activations(gates: number[]): Activation[] {
  return PLANET_NAMES.map((planet: PlanetName, i) => {
    const gate = gates[i % gates.length] ?? 1;
    return {
      planet,
      longitude: longitudeOf(gate, 0.3 + (i % 5) * 0.12),
      gate,
      line: (i % 6) + 1,
      color: 1,
      tone: 1,
      center: centerOfGate(gate),
    };
  });
}

function sourceOf(inP: boolean, inD: boolean): GateSource {
  if (inP && inD) return 'both';
  return inP ? 'personality' : 'design';
}

/** A minimal but internally consistent Chart built from gates per source. */
export function fakeChart(options: FakeChartOptions = {}): Chart {
  const personality = activations(options.personality ?? [20, 34, 57, 10, 1]);
  const design = activations(options.design ?? [34, 20, 51, 25, 8]);
  const gateSources: Record<number, GateSource> = {};
  const p = new Set([...personality.map((a) => a.gate), ...(options.extraPersonality ?? [])]);
  const d = new Set([...design.map((a) => a.gate), ...(options.extraDesign ?? [])]);
  for (const g of [...p, ...d]) gateSources[g] = sourceOf(p.has(g), d.has(g));
  const activeGates = Object.keys(gateSources)
    .map(Number)
    .sort((a, b) => a - b);
  const channels: ChannelInfo[] = CHANNEL_LIST.filter(
    (c) => activeGates.includes(c.gates[0]) && activeGates.includes(c.gates[1]),
  ).map((c) => ({ gates: [...c.gates], centers: [...c.centers] }));
  const inChannel = new Set(channels.flatMap((c) => c.gates));
  const definedSet = new Set<CenterName>(channels.flatMap((c) => c.centers));
  const definedCenters = CENTER_NAMES.filter((c) => definedSet.has(c));
  const openCenters = CENTER_NAMES.filter((c) => !definedSet.has(c));
  return {
    input: { name: options.name ?? 'Test Person', date: '1990-01-01', time: '12:00', utcOffset: 0 },
    birthUtc: '1990-01-01T12:00:00Z',
    designUtc: '1989-10-05T12:00:00Z',
    personality,
    design,
    type: 'Generator',
    strategy: 'To respond',
    notSelfTheme: 'Frustration',
    authority: 'Sacral',
    profile: '1/3',
    definition: 'Single Definition',
    components: [definedCenters],
    definedCenters,
    openCenters,
    channels,
    activeGates,
    hangingGates: activeGates.filter((g) => !inChannel.has(g)),
    gateSources,
    crossGates: { personalitySun: 20, personalityEarth: 34, designSun: 34, designEarth: 20 },
  };
}

/** Hand-built comparison (kinds worked out from the two charts). */
export function fakeComparison(a: Chart, b: Chart): Comparison {
  const ga = new Set(a.activeGates);
  const gb = new Set(b.activeGates);
  const both = new Set([...ga, ...gb]);
  const keysA = new Set(a.channels.map((c) => channelKey(...c.gates)));
  const keysB = new Set(b.channels.map((c) => channelKey(...c.gates)));
  const channels: ComparedChannel[] = [];
  const compositeChannels: ChannelInfo[] = [];
  const counts: Record<DynamicKind, number> = {
    electromagnetic: 0,
    companionship: 0,
    dominance: 0,
    compromise: 0,
  };
  for (const c of CHANNEL_LIST) {
    const key = channelKey(...c.gates);
    const [g1, g2] = c.gates;
    const inA = keysA.has(key);
    const inB = keysB.has(key);
    const inComposite = both.has(g1) && both.has(g2);
    if (inComposite) compositeChannels.push({ gates: [...c.gates], centers: [...c.centers] });
    if (!inComposite) continue;
    let kind: DynamicKind;
    let owner: 'a' | 'b' | undefined;
    if (inA && inB) kind = 'companionship';
    else if (!inA && !inB) kind = 'electromagnetic';
    else {
      owner = inA ? 'a' : 'b';
      const other = inA ? gb : ga;
      kind = other.has(g1) || other.has(g2) ? 'compromise' : 'dominance';
    }
    counts[kind]++;
    channels.push({ gates: [...c.gates], centers: [...c.centers], kind, owner });
  }
  const compositeDefined = new Set<CenterName>(compositeChannels.flatMap((c) => c.centers));
  const own = new Set<CenterName>([...a.definedCenters, ...b.definedCenters]);
  return {
    channels,
    compositeDefinedCenters: CENTER_NAMES.filter((c) => compositeDefined.has(c)),
    compositeOpenCenters: CENTER_NAMES.filter((c) => !compositeDefined.has(c)),
    newlyDefinedCenters: CENTER_NAMES.filter((c) => compositeDefined.has(c) && !own.has(c)),
    compositeChannels,
    compositeGates: [...both].sort((x, y) => x - y),
    counts,
  };
}

/** A fixture with every channel complete (all nine centers defined). */
export function fullChart(): Chart {
  const all = CHANNEL_LIST.flatMap((c) => [...c.gates]);
  return fakeChart({
    extraPersonality: all.filter((_, i) => i % 2 === 0),
    extraDesign: all.filter((_, i) => i % 2 === 1),
    name: 'Full Chart',
  });
}
