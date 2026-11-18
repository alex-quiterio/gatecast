import { createContext } from 'preact';
import { useContext } from 'preact/hooks';
import type { Chart } from '@/types';
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
  /** The most recently computed chart this session (memory only), used by the library. */
  myChart: Chart | undefined;
  /** Remember a chart as "my chart" for the library. */
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
