import { useEffect, useRef, useState } from 'preact/hooks';
import type { BirthInput } from '@/types';
import type { Place } from '@/places';
import {
  emptyFormState,
  formStateFromInput,
  validateForm,
  zoneSummary,
  type FormErrors,
  type FormState,
} from '@ui/form-logic';
import { MAX_NAME_LENGTH } from '@ui/share';
import { Icon } from './icons';
import { PlaceCombobox } from './place-combobox';
import { ZoneSelect } from './zone-select';

/** Display string stored with a chosen place, e.g. `Forlì, Italy`. */
export function placeLabel(place: Place): string {
  return `${place.name}, ${place.country}`;
}

/** Props of {@link BirthForm}. */
export interface BirthFormProps {
  /** Unique prefix so several forms can share a page. */
  idPrefix: string;
  submitLabel: string;
  /** Dense layout for side panels. */
  compact?: boolean;
  /** Start from this person (a link, a saved chart). Change the `key` to reset. */
  initial?: BirthInput | undefined;
  onSubmit: (input: BirthInput) => void;
  /** Override the place search box (tests inject a fake). */
  PlaceField?: typeof PlaceCombobox;
}

/**
 * The birth data form. Birth place is the primary field: choosing a place sets
 * the time zone; the offset on that date is shown beneath it. A disclosure
 * reveals a zone picker and a manual UTC offset for places that are not found.
 * Validation lives in `form-logic.ts`.
 */
export function BirthForm({
  idPrefix: p,
  submitLabel,
  compact = false,
  initial,
  onSubmit,
  PlaceField = PlaceCombobox,
}: BirthFormProps) {
  const [state, setState] = useState<FormState>(() =>
    initial ? formStateFromInput(initial) : emptyFormState(),
  );
  // What is typed in the place box; equals `state.place` once a place is chosen.
  const [placeText, setPlaceText] = useState(initial?.place ?? '');
  const [zoneFromPlace, setZoneFromPlace] = useState(Boolean(initial?.place && initial.timeZone));
  const [errors, setErrors] = useState<FormErrors>({});
  const root = useRef<HTMLFormElement>(null);
  const focusField = useRef<string | undefined>(undefined);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]): void =>
    setState((s) => ({ ...s, [key]: value }));

  useEffect(() => {
    const id = focusField.current;
    focusField.current = undefined;
    if (id) root.current?.querySelector<HTMLElement>(`#${p}-${id}`)?.focus();
  }, [errors, p]);

  const submit = (event: Event): void => {
    event.preventDefault();
    const result = validateForm(state);
    if (!result.ok) {
      setErrors(result.errors);
      const order = ['name', 'date', 'time', 'timeZone', 'offset'] as const;
      const first = order.find((f) => result.errors[f]);
      focusField.current = first === 'timeZone' ? (state.manualOffset ? 'offset' : 'place') : first;
      if (result.errors.offset) set('advancedOpen', true);
      return;
    }
    setErrors({});
    onSubmit(result.input);
  };

  const onPlaceInput = (text: string): void => {
    setPlaceText(text);
    if (text !== state.place) {
      setState((s) => ({
        ...s,
        place: '',
        timeZone: zoneFromPlace ? '' : s.timeZone,
      }));
      if (zoneFromPlace) setZoneFromPlace(false);
    }
  };
  const onPlaceSelect = (place: Place): void => {
    const label = placeLabel(place);
    setPlaceText(label);
    setZoneFromPlace(true);
    setState((s) => ({ ...s, place: label, timeZone: place.timeZone, manualOffset: false }));
    setErrors((e) => {
      const next = { ...e };
      delete next.timeZone;
      return next;
    });
  };
  const onZoneChange = (timeZone: string): void => {
    setZoneFromPlace(false);
    setPlaceText('');
    setState((s) => ({ ...s, timeZone, place: '' }));
  };

  const note = state.manualOffset ? '' : zoneSummary(state.timeZone, state.date, state.time);
  const err = (field: keyof FormErrors): string => errors[field] ?? '';
  const describe = (field: string, extra = ''): string => `${p}-${field}-error ${extra}`.trim();

  return (
    <form
      ref={root}
      class={compact ? 'birth-form compact' : 'birth-form'}
      noValidate
      autocomplete="off"
      onSubmit={submit}
    >
      <div class="field-grid">
        <div class="field field-wide">
          <label for={`${p}-name`}>Name</label>
          <input
            id={`${p}-name`}
            type="text"
            autocomplete="off"
            autocapitalize="words"
            enterkeyhint="next"
            maxLength={MAX_NAME_LENGTH}
            placeholder="Optional"
            value={state.name}
            aria-invalid={Boolean(err('name'))}
            aria-describedby={describe('name')}
            onInput={(e) => set('name', e.currentTarget.value)}
          />
          <p class="error" id={`${p}-name-error`} aria-live="polite">
            {err('name')}
          </p>
        </div>
        <div class="field">
          <label for={`${p}-date`}>Date of birth</label>
          <input
            id={`${p}-date`}
            type="date"
            required
            min="1800-01-01"
            autocomplete="off"
            value={state.date}
            aria-invalid={Boolean(err('date'))}
            aria-describedby={describe('date')}
            onInput={(e) => set('date', e.currentTarget.value)}
          />
          <p class="error" id={`${p}-date-error`} aria-live="polite">
            {err('date')}
          </p>
        </div>
        <div class="field">
          <label for={`${p}-time`}>Time of birth (24h, local)</label>
          <input
            id={`${p}-time`}
            type="time"
            required
            autocomplete="off"
            value={state.time}
            aria-invalid={Boolean(err('time'))}
            aria-describedby={describe('time')}
            onInput={(e) => set('time', e.currentTarget.value)}
          />
          <p class="error" id={`${p}-time-error`} aria-live="polite">
            {err('time')}
          </p>
        </div>
        <div class="field field-wide">
          <PlaceField
            id={`${p}-place`}
            label="Birth place"
            value={placeText}
            onInput={onPlaceInput}
            onSelect={onPlaceSelect}
            invalid={Boolean(err('timeZone'))}
            describedBy={`${p}-place-hint ${p}-zone-note ${p}-timeZone-error`}
          />
          <p class="hint" id={`${p}-place-hint`}>
            Start typing a city, e.g. Forlì or Venice.
          </p>
          <p class="zone-note" id={`${p}-zone-note`} aria-live="polite">
            {note}
          </p>
          <p class="error" id={`${p}-timeZone-error`} aria-live="polite">
            {err('timeZone')}
          </p>
        </div>
        <div class="field field-wide">
          <button
            type="button"
            class="disclosure"
            aria-expanded={state.advancedOpen}
            aria-controls={`${p}-advanced`}
            onClick={() => set('advancedOpen', !state.advancedOpen)}
          >
            <Icon name="chevron" size={12} />
            <span>Can&apos;t find your place? Choose a time zone or enter the offset</span>
          </button>
        </div>
        <div class="field-wide advanced" id={`${p}-advanced`} hidden={!state.advancedOpen}>
          <div class="field-grid">
            <div class="field field-wide" hidden={state.manualOffset}>
              <ZoneSelect
                id={`${p}-zone`}
                label="Time zone"
                value={state.timeZone}
                onChange={onZoneChange}
              />
            </div>
            <div class="field field-wide check">
              <input
                id={`${p}-manual`}
                type="checkbox"
                checked={state.manualOffset}
                onChange={(e) => set('manualOffset', e.currentTarget.checked)}
              />
              <label for={`${p}-manual`}>Set the UTC offset manually instead</label>
            </div>
            <div class="field" hidden={!state.manualOffset}>
              <label for={`${p}-offset`}>UTC offset in hours at birth</label>
              <div class="offset-row">
                <input
                  id={`${p}-offset`}
                  type="text"
                  inputMode="decimal"
                  autocomplete="off"
                  autocapitalize="off"
                  spellcheck={false}
                  placeholder="e.g. 1 or -5 or 5.5"
                  value={state.offset}
                  aria-invalid={Boolean(err('offset'))}
                  aria-describedby={describe('offset')}
                  onInput={(e) => set('offset', e.currentTarget.value)}
                />
                <button
                  type="button"
                  class="btn btn-icon"
                  aria-label="Toggle east or west of Greenwich (plus or minus sign)"
                  onClick={() =>
                    set(
                      'offset',
                      state.offset.trim().startsWith('-')
                        ? state.offset.trim().slice(1)
                        : `-${state.offset.trim()}`,
                    )
                  }
                >
                  +/&minus;
                </button>
              </div>
              <p class="error" id={`${p}-offset-error`} aria-live="polite">
                {err('offset')}
              </p>
            </div>
          </div>
        </div>
      </div>
      <p class="error" id={`${p}-form-error`} role="alert">
        {err('form')}
      </p>
      <button type="submit" class="btn btn-primary btn-block">
        {submitLabel}
      </button>
    </form>
  );
}
