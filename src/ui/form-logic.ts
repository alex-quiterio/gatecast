import type { BirthInput } from '@/types';
import { utcOffsetForZone, validateBirthInput } from '@engine';
import { MAX_NAME_LENGTH, MAX_PLACE_LENGTH } from './share';

/** Raw values as typed into the birth form. */
export interface FormValues {
  name: string;
  /** Display string of the chosen birth place, e.g. `Forlì, Italy`. Display only. */
  place?: string;
  date: string;
  time: string;
  timeZone: string;
  manualOffset: boolean;
  /** Hours from UTC as text, used only when `manualOffset` is set. */
  offset: string;
}

export type FormField = 'name' | 'date' | 'time' | 'timeZone' | 'offset' | 'form';

export type FormErrors = Partial<Record<FormField, string>>;
export type FormResult = { ok: true; input: BirthInput } | { ok: false; errors: FormErrors };

/** Format an offset in hours as `UTC+5:30`. */
export function formatOffset(hours: number): string {
  const sign = hours < 0 ? '-' : '+';
  const abs = Math.abs(hours);
  const whole = Math.floor(abs);
  const minutes = Math.round((abs - whole) * 60);
  return `UTC${sign}${whole}${minutes ? ':' + String(minutes).padStart(2, '0') : ''}`;
}

/** Offset of `timeZone` at the given local moment, or `undefined` if it cannot be resolved. */
export function resolveOffset(timeZone: string, date: string, time: string): number | undefined {
  if (!timeZone.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    return undefined;
  }
  try {
    const value = utcOffsetForZone(timeZone.trim(), date, time);
    return Number.isFinite(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Validate form values (pure, DOM-free). On success returns the `BirthInput`.
 *
 * @param values Raw form values.
 * @param knownZones Optional list of accepted IANA zones.
 */
export function validateForm(values: FormValues, knownZones?: readonly string[]): FormResult {
  const errors: FormErrors = {};
  const name = values.name.trim();
  if (name.length > MAX_NAME_LENGTH) {
    errors.name = `Keep the name under ${MAX_NAME_LENGTH} characters.`;
  }
  if (!values.date) errors.date = 'Enter the date of birth.';
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(values.date)) errors.date = 'Use the format YYYY-MM-DD.';
  if (!values.time) errors.time = 'Enter the time of birth. Even a few minutes can matter.';
  else if (!/^\d{2}:\d{2}$/.test(values.time)) errors.time = 'Use 24-hour time, HH:MM.';

  let utcOffset: number | undefined;
  if (values.manualOffset) {
    const text = values.offset.trim().replace(',', '.');
    const parsed = text === '' ? Number.NaN : Number(text);
    if (!Number.isFinite(parsed) || parsed < -12 || parsed > 14) {
      errors.offset = 'Enter the offset in hours between -12 and 14, for example 1 or 5.5.';
    } else {
      utcOffset = parsed;
    }
  } else if (!values.timeZone.trim()) {
    errors.timeZone =
      'Search for your birth place, or choose a time zone or enter the offset below.';
  } else if (knownZones && !knownZones.includes(values.timeZone.trim())) {
    errors.timeZone = 'Pick a time zone from the list, for example Europe/Lisbon.';
  } else if (!errors.date && !errors.time) {
    utcOffset = resolveOffset(values.timeZone, values.date, values.time);
    if (utcOffset === undefined) errors.timeZone = 'That time zone could not be resolved.';
  }

  if (Object.keys(errors).length > 0 || utcOffset === undefined) return { ok: false, errors };

  const input: BirthInput = { name, date: values.date, time: values.time, utcOffset };
  if (!values.manualOffset) input.timeZone = values.timeZone.trim();
  const place = (values.place ?? '').trim().slice(0, MAX_PLACE_LENGTH);
  if (place) input.place = place;
  const problems = validateBirthInput(input);
  if (problems.length > 0) return { ok: false, errors: { form: problems.join(' ') } };
  return { ok: true, input };
}

/** The browser's own zone, if it can be determined. */
export function browserZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return '';
  }
}

/** Form state that is richer than {@link FormValues}: what the form component keeps. */
export interface FormState extends Required<FormValues> {
  /** Whether the "Can't find your place?" disclosure is open. */
  advancedOpen: boolean;
}

/** An empty form. */
export function emptyFormState(): FormState {
  return {
    name: '',
    place: '',
    date: '',
    time: '',
    timeZone: '',
    manualOffset: false,
    offset: '0',
    advancedOpen: false,
  };
}

/**
 * Whether the zone's own rules give the same offset as the one stored with the
 * person. A shared link can carry both and they may disagree; the stored offset
 * is what the chart was computed with, so the form must show that one.
 */
export function offsetMatchesZone(input: BirthInput): boolean {
  if (!input.timeZone) return false;
  try {
    return utcOffsetForZone(input.timeZone, input.date, input.time) === input.utcOffset;
  } catch {
    return false;
  }
}

/** Fill the form state from a person (a link, a saved chart). */
export function formStateFromInput(input: BirthInput): FormState {
  const state: FormState = {
    ...emptyFormState(),
    name: input.name,
    place: input.place ?? '',
    date: input.date,
    time: input.time,
  };
  if (input.timeZone && offsetMatchesZone(input)) {
    state.timeZone = input.timeZone;
    // A place-less link that only carries a zone should reveal the zone it uses.
    state.advancedOpen = !input.place;
  } else {
    state.manualOffset = true;
    state.offset = String(input.utcOffset);
    state.advancedOpen = true;
  }
  return state;
}

/** "Europe/Rome · UTC+1 on that date", or just the zone when the date is unknown. */
export function zoneSummary(timeZone: string, date: string, time: string): string {
  if (!timeZone.trim()) return '';
  const offset = resolveOffset(timeZone, date, time || '12:00');
  return offset === undefined ? timeZone : `${timeZone} · ${formatOffset(offset)} on that date`;
}
