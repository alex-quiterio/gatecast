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
  /** Id of the person that is "my chart" (marked with a filled star). */
  myId?: string | undefined;
  /** Make a person "my chart"; when given, each row gets a star button. */
  onPin?: ((person: SavedPerson) => void) | undefined;
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
  myId,
  onPin,
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
                {onPin ? (
                  <button
                    type="button"
                    class={`btn btn-icon btn-ghost pin${person.id === myId ? ' is-on' : ''}`}
                    aria-pressed={person.id === myId}
                    aria-label={`Use ${label} as my chart`}
                    title={person.id === myId ? 'This is my chart' : 'Use as my chart'}
                    onClick={() => {
                      onPin(person);
                      setStatus(`${label} is now my chart.`);
                    }}
                  >
                    <Icon name="star" />
                  </button>
                ) : null}
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
