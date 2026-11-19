import type { Chart } from '@/types';
import { useApp } from '@ui/context';
import { sameInput, type MyChartSetting } from '@ui/mine-logic';
import type { SavedPerson } from '@ui/storage';
import { Menu, type MenuItem } from './menu';

/** The words on the chip: who the library marks entries for. */
export function chipText(setting: MyChartSetting, chart: Chart | undefined): string {
  if (setting.kind === 'none') return 'Marking entries for: nobody (change)';
  if (!chart) return 'No chart selected (choose)';
  return `Marking entries for: ${chart.input.name || 'Unnamed'} (change)`;
}

/** Menu entries of the chip: saved charts, the automatic default, and none. */
export function chipItems(
  people: readonly SavedPerson[],
  setting: MyChartSetting,
  choose: (setting: MyChartSetting) => void,
  castNew: () => void,
): MenuItem[] {
  const picked = setting.kind === 'chart' ? setting.input : undefined;
  const items: MenuItem[] = people.map((p) => ({
    id: `p-${p.id}`,
    label: `${p.input.name || 'Unnamed'} (${p.input.date})`,
    checked: sameInput(picked, p.input),
    onSelect: () => choose({ kind: 'chart', input: p.input }),
  }));
  // A picked chart that is not (or no longer) in the saved list still shows up, so it can be seen.
  if (picked && !people.some((p) => sameInput(p.input, picked))) {
    items.unshift({
      id: 'picked',
      label: `${picked.name || 'Unnamed'} (${picked.date})`,
      checked: true,
      onSelect: () => choose({ kind: 'chart', input: picked }),
    });
  }
  items.push({
    id: 'auto',
    label: 'Most recent chart (automatic)',
    checked: setting.kind === 'auto',
    separated: true,
    onSelect: () => choose({ kind: 'auto' }),
  });
  items.push({
    id: 'none',
    label: 'None (no marks)',
    checked: setting.kind === 'none',
    onSelect: () => choose({ kind: 'none' }),
  });
  items.push({
    id: 'new',
    label: 'Cast a new chart…',
    icon: 'plus',
    separated: true,
    onSelect: castNew,
  });
  return items;
}

/**
 * "Marking entries for: Ada (change)": which chart the library marks, with a
 * small menu of saved charts, the automatic default and "None".
 */
export function MyChartChip() {
  const { people, myChart, myChartSetting, chooseMyChart, navigate } = useApp();
  return (
    <Menu
      class="my-chart-chip"
      label="Chart to mark entries for"
      buttonText={chipText(myChartSetting, myChart)}
      icon="chart"
      items={chipItems(people, myChartSetting, chooseMyChart, () => navigate('#/'))}
    />
  );
}
