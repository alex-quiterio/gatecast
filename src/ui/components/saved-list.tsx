import { useState } from 'preact/hooks';
import type { BirthInput } from '@/types';
import type { SavedPerson } from '@ui/storage';
import { describeBirth } from '@ui/views/common';
import { Icon } from './icons';

/** Props of {@link SavedList}. */
export interface SavedListProps {
  people: readonly SavedPerson[];
  /** Id (see `PeopleStore`) of the chart that is open, to highlight it. */
  activeId?: string | undefined;
  /** Verb on the open button, used in its accessible name, e.g. `Load`. */
  loadLabel?: string;
  onOpen: (input: BirthInput) => void;
  onDelete: (person: SavedPerson) => void;
  /** Show the birth moment under each name. */
  detailed?: boolean;
}

/**
 * Saved people as a list of documents: open one, or delete it. Announces
 * deletions politely. Renders nothing when empty.
 */
export function SavedList({
  people,
  activeId,
  loadLabel = 'Open',
  onOpen,
  onDelete,
  detailed = true,
}: SavedListProps) {
  const [status, setStatus] = useState('');
  return (
    <div class="saved">
      {people.length > 0 ? (
        <ul class="saved-list">
          {people.map((person) => {
            const label = person.input.name || 'Unnamed';
            return (
              <li key={person.id} class={person.id === activeId ? 'is-active' : undefined}>
                <button
                  type="button"
                  class="saved-open"
                  aria-label={`${loadLabel} ${label}`}
                  aria-current={person.id === activeId ? 'true' : undefined}
                  onClick={() => onOpen(person.input)}
                >
                  <span class="saved-name" title={label}>
                    {label}
                  </span>
                  {detailed ? <span class="saved-meta">{describeBirth(person.input)}</span> : null}
                </button>
                <button
                  type="button"
                  class="btn btn-icon btn-ghost"
                  aria-label={`Delete ${label}`}
                  onClick={() => {
                    onDelete(person);
                    setStatus(`Deleted ${label}.`);
                  }}
                >
                  <Icon name="trash" />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
      <p class="sr-only" aria-live="polite">
        {status}
      </p>
    </div>
  );
}
