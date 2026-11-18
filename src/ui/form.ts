import type { BirthInput } from '@/types';
import { utcOffsetForZone, validateBirthInput } from '@engine';
import { h } from './dom';
import { MAX_NAME_LENGTH } from './share';

/** Raw values as typed into the birth form. */
export interface FormValues {
  name: string;
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
    errors.timeZone = 'Choose a time zone, or set the offset manually.';
  } else if (knownZones && !knownZones.includes(values.timeZone.trim())) {
    errors.timeZone = 'Pick a time zone from the list, for example Europe/Lisbon.';
  } else if (!errors.date && !errors.time) {
    utcOffset = resolveOffset(values.timeZone, values.date, values.time);
    if (utcOffset === undefined) errors.timeZone = 'That time zone could not be resolved.';
  }

  if (Object.keys(errors).length > 0 || utcOffset === undefined) return { ok: false, errors };

  const input: BirthInput = { name, date: values.date, time: values.time, utcOffset };
  if (!values.manualOffset) input.timeZone = values.timeZone.trim();
  const problems = validateBirthInput(input);
  if (problems.length > 0) return { ok: false, errors: { form: problems.join(' ') } };
  return { ok: true, input };
}

/** All IANA zones the browser knows, with a short fallback list. */
export function supportedZones(): string[] {
  try {
    const intl = Intl as unknown as { supportedValuesOf?: (key: string) => string[] };
    const zones = intl.supportedValuesOf?.('timeZone');
    if (zones && zones.length > 0) return zones.includes('UTC') ? zones : [...zones, 'UTC'];
  } catch {
    /* fall through */
  }
  return ['UTC', 'Europe/Lisbon', 'Europe/London', 'America/New_York', 'Asia/Tokyo'];
}

/** The browser's own zone, if it can be determined. */
export function browserZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return '';
  }
}

export interface BirthFormOptions {
  /** Unique prefix so several forms can share a page. */
  idPrefix: string;
  submitLabel: string;
  compact?: boolean;
  onSubmit: (input: BirthInput) => void;
}

export interface BirthForm {
  element: HTMLFormElement;
  /** Fill the fields from a person. */
  setValues(input: BirthInput): void;
}

let zoneListId = 0;
function zoneDatalist(zones: readonly string[]): HTMLDataListElement {
  const list = h('datalist', { id: `hd-zones-${zoneListId++}` });
  for (const zone of zones) list.appendChild(h('option', { value: zone }));
  return list;
}

/** Build the birth form component (DOM glue around `validateForm`). */
/**
 * Whether the zone's own rules give the same offset as the one stored with the
 * person. A shared link can carry both and they may disagree; the stored offset
 * is what the chart was computed with, so the form must show that one.
 */
function offsetMatchesZone(input: BirthInput): boolean {
  if (!input.timeZone) return false;
  try {
    return utcOffsetForZone(input.timeZone, input.date, input.time) === input.utcOffset;
  } catch {
    return false;
  }
}

export function createBirthForm(options: BirthFormOptions): BirthForm {
  const p = options.idPrefix;
  const zones = supportedZones();
  const datalist = zoneDatalist(zones);

  const name = h('input', {
    id: `${p}-name`,
    type: 'text',
    autocomplete: 'off',
    maxlength: MAX_NAME_LENGTH,
    placeholder: 'Optional',
  });
  const date = h('input', { id: `${p}-date`, type: 'date', required: true, min: '1800-01-01' });
  const time = h('input', { id: `${p}-time`, type: 'time', required: true });
  const zone = h('input', {
    id: `${p}-zone`,
    type: 'text',
    list: datalist.id,
    autocomplete: 'off',
    spellcheck: 'false',
    value: browserZone(),
    placeholder: 'Start typing, e.g. Lisbon',
  });
  const manual = h('input', { id: `${p}-manual`, type: 'checkbox' });
  const offset = h('input', {
    id: `${p}-offset`,
    type: 'text',
    inputmode: 'decimal',
    placeholder: 'e.g. 1 or -5 or 5.5',
    value: '0',
  });
  const offsetNote = h('p', { class: 'hint', id: `${p}-offset-note`, 'aria-live': 'polite' });
  const formError = h('p', { class: 'error', id: `${p}-form-error`, role: 'alert' });
  const errorEls: Record<Exclude<FormField, 'form'>, HTMLElement> = {
    name: h('p', { class: 'error', id: `${p}-name-error` }),
    date: h('p', { class: 'error', id: `${p}-date-error` }),
    time: h('p', { class: 'error', id: `${p}-time-error` }),
    timeZone: h('p', { class: 'error', id: `${p}-zone-error` }),
    offset: h('p', { class: 'error', id: `${p}-offset-error` }),
  };
  const inputs: Record<Exclude<FormField, 'form'>, HTMLInputElement> = {
    name,
    date,
    time,
    timeZone: zone,
    offset,
  };
  for (const [field, input] of Object.entries(inputs)) {
    const errorEl = errorEls[field as keyof typeof errorEls];
    input.setAttribute('aria-describedby', errorEl.id);
  }

  const offsetField = h('div', { class: 'field', hidden: true }, [
    h('label', { for: offset.id }, 'UTC offset in hours at birth'),
    offset,
    errorEls.offset,
  ]);
  const zoneField = h('div', { class: 'field field-wide' }, [
    h('label', { for: zone.id }, 'Time zone'),
    zone,
    datalist,
    offsetNote,
    errorEls.timeZone,
  ]);

  const values = (): FormValues => ({
    name: name.value,
    date: date.value,
    time: time.value,
    timeZone: zone.value,
    manualOffset: manual.checked,
    offset: offset.value,
  });

  const refreshOffset = (): void => {
    offsetNote.textContent = '';
    if (manual.checked) return;
    const resolved = resolveOffset(zone.value, date.value, time.value);
    if (resolved !== undefined) {
      offsetNote.textContent = `${formatOffset(resolved)} on that date`;
    }
  };

  manual.addEventListener('change', () => {
    offsetField.hidden = !manual.checked;
    zoneField.hidden = manual.checked;
    refreshOffset();
  });
  for (const el of [zone, date, time]) el.addEventListener('input', refreshOffset);

  const showErrors = (errors: FormErrors): void => {
    for (const field of Object.keys(inputs) as (keyof typeof inputs)[]) {
      const message = errors[field] ?? '';
      errorEls[field].textContent = message;
      inputs[field].setAttribute('aria-invalid', message ? 'true' : 'false');
    }
    formError.textContent = errors.form ?? '';
    const firstBad = (Object.keys(inputs) as (keyof typeof inputs)[]).find((f) => errors[f]);
    if (firstBad) inputs[firstBad].focus();
  };

  const form = h(
    'form',
    {
      class: options.compact ? 'birth-form compact' : 'birth-form',
      novalidate: true,
      autocomplete: 'off',
      on: {
        submit: (event) => {
          event.preventDefault();
          const result = validateForm(values(), manual.checked ? undefined : zones);
          if (!result.ok) {
            showErrors(result.errors);
            return;
          }
          showErrors({});
          options.onSubmit(result.input);
        },
      },
    },
    h('div', { class: 'field-grid' }, [
      h('div', { class: 'field field-wide' }, [
        h('label', { for: name.id }, 'Name'),
        name,
        errorEls.name,
      ]),
      h('div', { class: 'field' }, [
        h('label', { for: date.id }, 'Date of birth'),
        date,
        errorEls.date,
      ]),
      h('div', { class: 'field' }, [
        h('label', { for: time.id }, 'Time of birth (24h, local)'),
        time,
        errorEls.time,
      ]),
      zoneField,
      offsetField,
      h('div', { class: 'field field-wide check' }, [
        manual,
        h('label', { for: manual.id }, 'Set the UTC offset manually instead'),
      ]),
    ]),
    formError,
    h('button', { type: 'submit', class: 'btn btn-primary' }, options.submitLabel),
  );

  refreshOffset();
  return {
    element: form,
    setValues(input: BirthInput) {
      name.value = input.name;
      date.value = input.date;
      time.value = input.time;
      if (input.timeZone && offsetMatchesZone(input)) {
        zone.value = input.timeZone;
        manual.checked = false;
      } else {
        manual.checked = true;
        offset.value = String(input.utcOffset);
      }
      offsetField.hidden = !manual.checked;
      zoneField.hidden = manual.checked;
      showErrors({});
      refreshOffset();
    },
  };
}
