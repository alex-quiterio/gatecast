import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import {
  loadPlaces as defaultLoadPlaces,
  matchRange,
  searchPlaces,
  type Place,
  type PlaceIndex,
} from '@/places';

/** Props of {@link PlaceCombobox}. */
export interface PlaceComboboxProps {
  id: string;
  label: string;
  /** Text shown in the box (controlled). */
  value: string;
  /** Called on every edit. */
  onInput: (text: string) => void;
  /** Called when a result is chosen. The parent usually then sets `value`. */
  onSelect: (place: Place) => void;
  invalid?: boolean;
  /** Id(s) of the element(s) describing the field, e.g. an error message. */
  describedBy?: string;
  /**
   * Dataset loader. Defaults to the real memoised `loadPlaces`; tests inject a
   * fixture or a failing loader here.
   */
  loadPlaces?: () => Promise<PlaceIndex>;
}

type Status = 'idle' | 'loading' | 'ready' | 'error';

function Highlighted({ text, query }: { text: string; query: string }) {
  const range = matchRange(text, query);
  if (!range) return <>{text}</>;
  return (
    <>
      {text.slice(0, range[0])}
      <strong>{text.slice(range[0], range[1])}</strong>
      {text.slice(range[1])}
    </>
  );
}

/**
 * Birth-place search following the WAI-ARIA 1.2 combobox pattern with a list
 * popup. The dataset loads lazily on first focus.
 */
export function PlaceCombobox(props: PlaceComboboxProps) {
  const { id, label, value, onInput, onSelect, invalid, describedBy } = props;
  const load = props.loadPlaces ?? defaultLoadPlaces;
  const [status, setStatus] = useState<Status>('idle');
  const [index, setIndex] = useState<PlaceIndex | undefined>();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const ensureLoaded = () => {
    if (status === 'loading' || status === 'ready') return;
    setStatus('loading');
    load().then(
      (idx) => {
        if (!alive.current) return;
        setIndex(idx);
        setStatus('ready');
      },
      () => {
        if (alive.current) setStatus('error');
      },
    );
  };

  const results = useMemo(
    () => (index && open ? searchPlaces(index, value) : []),
    [index, open, value],
  );
  const queryReady = value.trim().length >= 2;
  const showList = open && status === 'ready' && results.length > 0;
  const showEmpty = open && status === 'ready' && queryReady && results.length === 0;
  const showLoading = open && status === 'loading';
  const showError = status === 'error' && open;
  const expanded = showList;
  const activeIndex = Math.min(active, Math.max(results.length - 1, 0));
  const optionId = (i: number) => `${id}-opt-${i}`;

  useEffect(() => {
    setActive(0);
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: Event) => {
      if (root.current && e.target instanceof Node && !root.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!showList) return;
    const row = listRef.current?.children[activeIndex];
    if (row && typeof row.scrollIntoView === 'function') row.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, showList]);

  useEffect(() => {
    // On small screens keep the whole popup above the on-screen keyboard.
    if (showList && listRef.current && typeof listRef.current.scrollIntoView === 'function') {
      if (window.matchMedia?.('(max-width: 640px)').matches) {
        listRef.current.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [showList]);

  const choose = (place: Place) => {
    onSelect(place);
    setOpen(false);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const last = results.length - 1;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!open) {
          setOpen(true);
          ensureLoaded();
        } else if (last >= 0) setActive(activeIndex >= last ? 0 : activeIndex + 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (open && last >= 0) setActive(activeIndex <= 0 ? last : activeIndex - 1);
        break;
      case 'Home':
        if (showList) {
          e.preventDefault();
          setActive(0);
        }
        break;
      case 'End':
        if (showList) {
          e.preventDefault();
          setActive(last);
        }
        break;
      case 'Enter': {
        if (!open) break;
        // An open popup owns Enter: pick the highlighted row, never submit the form.
        e.preventDefault();
        const place = showList ? results[activeIndex] : undefined;
        if (place) choose(place);
        break;
      }
      case 'Escape':
        if (open) {
          e.preventDefault();
          setOpen(false);
        } else if (value) {
          e.preventDefault();
          onInput('');
        }
        break;
      default:
    }
  };

  let statusText = '';
  if (showLoading) statusText = 'Loading places…';
  else if (showError) statusText = 'Places could not be loaded.';
  else if (showList)
    statusText = `${results.length} ${results.length === 1 ? 'place' : 'places'} found`;
  else if (showEmpty) statusText = 'No places found';

  const retry = () => {
    setStatus('idle');
    setIndex(undefined);
    setStatus('loading');
    load().then(
      (idx) => {
        if (!alive.current) return;
        setIndex(idx);
        setStatus('ready');
      },
      () => {
        if (alive.current) setStatus('error');
      },
    );
  };

  return (
    <div class="pc" ref={root}>
      <label class="pc-label" for={id}>
        {label}
      </label>
      <div class="pc-box">
        <input
          id={id}
          class="pc-input"
          type="text"
          role="combobox"
          aria-expanded={expanded}
          aria-controls={`${id}-listbox`}
          aria-autocomplete="list"
          aria-activedescendant={expanded ? optionId(activeIndex) : undefined}
          aria-invalid={invalid ? 'true' : undefined}
          aria-describedby={describedBy}
          autocomplete="off"
          autocapitalize="words"
          spellcheck={false}
          enterkeyhint="search"
          value={value}
          onFocus={() => {
            ensureLoaded();
            if (status !== 'ready' || queryReady) setOpen(true);
          }}
          onInput={(e) => {
            onInput(e.currentTarget.value);
            setOpen(true);
            ensureLoaded();
          }}
          onKeyDown={onKeyDown}
          onBlur={(e) => {
            const next = e.relatedTarget;
            if (!(next instanceof Node && root.current?.contains(next))) setOpen(false);
          }}
        />
        <div class="pc-status" role="status" aria-live="polite">
          {statusText}
        </div>
        {showLoading && <div class="pc-note">Loading places…</div>}
        {showError && (
          <div class="pc-note pc-error">
            <span>Places could not be loaded. You can set the time zone directly below.</span>
            <button
              type="button"
              class="pc-retry"
              onMouseDown={(e) => e.preventDefault()}
              onClick={retry}
            >
              Retry
            </button>
          </div>
        )}
        {showEmpty && <div class="pc-note">No places found</div>}
        <ul
          id={`${id}-listbox`}
          class="pc-list"
          role="listbox"
          aria-label={label}
          ref={listRef}
          hidden={!showList}
        >
          {showList &&
            results.map((place, i) => (
              <li
                key={`${place.name}|${place.admin ?? ''}|${place.countryCode}|${place.population}`}
                id={optionId(i)}
                class="pc-option"
                role="option"
                aria-selected={i === activeIndex}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(place)}
                onMouseMove={() => i !== activeIndex && setActive(i)}
              >
                <span class="pc-name">
                  <Highlighted text={place.name} query={value} />
                </span>
                <span class="pc-meta">
                  {[place.admin, place.country].filter(Boolean).join(', ')} · {place.timeZone}
                </span>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}
