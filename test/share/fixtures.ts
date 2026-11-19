import { compareCharts, computeChart } from '@engine';
import type { ShareSubject } from '@ui/share/types';

export const HOSTILE = '"><script>alert(1)</script> & <b>';
export const LONG_NAME = 'Maximiliana Alexandrina Wilhelmina Example-Longsurname de Testington';
export const LINK =
  'https://example.test/gatecast/#/chart?n=Sam+Example&d=1985-07-22&t=18%3A05&u=-4&p=New+York';

const inputA = {
  name: 'Sam Example',
  date: '1985-07-22',
  time: '18:05',
  utcOffset: -4,
  place: 'New York, United States',
};
const inputB = {
  name: LONG_NAME,
  date: '1990-02-11',
  time: '06:30',
  utcOffset: 1,
  place: 'Lisbon, Portugal',
};

/** A chart subject whose name can be replaced. */
export function chartSubject(name = inputA.name): ShareSubject {
  const input = { ...inputA, name };
  return { kind: 'chart', chart: computeChart(input), input, link: LINK };
}

/** A compare subject. */
export function compareSubject(): ShareSubject {
  const a = computeChart(inputA);
  const b = computeChart(inputB);
  return { kind: 'compare', a, b, inputA, inputB, comparison: compareCharts(a, b), link: LINK };
}
