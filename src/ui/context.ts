import { createContext } from 'preact';
import { useContext } from 'preact/hooks';
import type { Chart } from '@/types';
import type { MyChartSetting } from './mine-logic';
import type { PeopleStore, SavedPerson } from './storage';

/** What the shell hands to every view. */
export interface AppContextValue {
  store: PeopleStore;
  /** Saved people, newest first. */
  people: readonly SavedPerson[];
  /** Re-read the store after `add` or `remove`. */
  refreshPeople(): void;
  /** Change the hash (re-renders even when it is unchanged). */
  navigate(hash: string): void;
  /** Replace the hash without adding a history entry or re-rendering. */
  replaceHash(hash: string): void;
  /** Absolute URL for a hash, for share links. */
  urlFor(hash: string): string;
  /** The current hash. */
  hash: string;
  /** Open the quick-find palette. */
  openSearch(): void;
  /**
   * The chart the library marks entries for: the one the person picked
   * (restored from storage on a fresh load), else the most recently computed.
   */
  myChart: Chart | undefined;
  /** How `myChart` was chosen: automatically, explicitly none, or a picked chart. */
  myChartSetting: MyChartSetting;
  /** Pick which chart is "my chart" (persisted); `auto` goes back to the latest chart. */
  chooseMyChart(setting: MyChartSetting): void;
  /** Remember a freshly computed chart (used when no chart is picked). */
  rememberChart(chart: Chart): void;
}

/** Context carrying the {@link AppContextValue}. */
export const AppContext = createContext<AppContextValue | undefined>(undefined);

/** The app context; throws when used outside the shell. */
export function useApp(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used inside <App>');
  return value;
}
