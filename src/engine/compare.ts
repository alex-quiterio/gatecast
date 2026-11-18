import type {
  CenterName,
  ChannelInfo,
  ComparedChannel,
  Chart,
  Comparison,
  DynamicKind,
} from '@/types';
import { analyzeGates } from './bodygraph';
import { CHANNEL_LIST } from './data';

/**
 * Compares two charts channel by channel. For each of the 36 channels, with
 * `A` and `B` the sets of active gates of each person:
 *
 * - electromagnetic: neither person has the complete channel, but each holds
 *   exactly one of its two gates and they are different gates, so together
 *   the two people complete it;
 * - companionship: both people have the complete channel;
 * - dominance: exactly one person has the complete channel and the other has
 *   neither of its gates (`owner` is the one who has it);
 * - compromise: exactly one person has the complete channel and the other
 *   has one of its two gates (`owner` is the one who has it).
 *
 * Channels matching none of these are left out. The composite runs the union
 * of both gate sets through the normal channel/center rules;
 * `newlyDefinedCenters` are centers defined in the composite but in neither
 * chart on its own.
 */
export function compareCharts(a: Chart, b: Chart): Comparison {
  const gatesA = new Set(a.activeGates);
  const gatesB = new Set(b.activeGates);

  const channels: ComparedChannel[] = [];
  for (const channel of CHANNEL_LIST) {
    const [g1, g2] = channel.gates;
    const aCount = Number(gatesA.has(g1)) + Number(gatesA.has(g2));
    const bCount = Number(gatesB.has(g1)) + Number(gatesB.has(g2));
    const info: ChannelInfo = { gates: [g1, g2], centers: [...channel.centers] };

    if (aCount === 2 && bCount === 2) {
      channels.push({ ...info, kind: 'companionship' });
    } else if (aCount === 2 || bCount === 2) {
      const owner = aCount === 2 ? 'a' : 'b';
      const otherCount = aCount === 2 ? bCount : aCount;
      channels.push({ ...info, kind: otherCount === 0 ? 'dominance' : 'compromise', owner });
    } else if (aCount === 1 && bCount === 1) {
      const split = gatesA.has(g1) ? gatesB.has(g2) : gatesB.has(g1);
      if (split) channels.push({ ...info, kind: 'electromagnetic' });
    }
  }

  const composite = analyzeGates([...gatesA, ...gatesB]);
  const own = new Set<CenterName>([...a.definedCenters, ...b.definedCenters]);
  const counts: Record<DynamicKind, number> = {
    electromagnetic: 0,
    companionship: 0,
    dominance: 0,
    compromise: 0,
  };
  for (const c of channels) counts[c.kind] += 1;

  return {
    channels,
    compositeDefinedCenters: composite.definedCenters,
    compositeOpenCenters: composite.openCenters,
    newlyDefinedCenters: composite.definedCenters.filter((c) => !own.has(c)),
    compositeChannels: composite.channels,
    compositeGates: composite.activeGates,
    counts,
  };
}
