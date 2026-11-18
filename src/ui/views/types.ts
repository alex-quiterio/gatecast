import type { PeopleStore } from '@ui/storage';

/** What the shell hands to every view. */
export interface ViewContext {
  store: PeopleStore;
  /** Change the hash (re-renders even when it is unchanged). */
  navigate(hash: string): void;
  /** Replace the hash without adding a history entry or re-rendering. */
  replaceHash(hash: string): void;
  /** Absolute URL for a hash, for share links. */
  urlFor(hash: string): string;
}
