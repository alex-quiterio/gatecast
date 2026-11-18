import type { BirthInput } from '@/types';

/** Days in a month of a (proleptic Gregorian) year. */
function daysInMonth(year: number, month: number): number {
  if (month === 2) return isLeap(year) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

function isLeap(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Validates form input and returns human-readable problems (empty array when
 * valid). Checks: `YYYY-MM-DD` real calendar date with year 1800-2100,
 * 24h `HH:MM` time (so 24:00 is rejected), a finite UTC offset in [-12, 14]
 * and a name of at most 80 characters.
 */
export function validateBirthInput(input: BirthInput): string[] {
  const errors: string[] = [];

  if (typeof input.name !== 'string') errors.push('Name must be text.');
  else if (input.name.length > 80) errors.push('Name must be 80 characters or fewer.');

  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.date);
  if (!dateMatch) {
    errors.push('Date must be in YYYY-MM-DD format.');
  } else {
    const year = Number(dateMatch[1]);
    const month = Number(dateMatch[2]);
    const day = Number(dateMatch[3]);
    if (year < 1800 || year > 2100) errors.push('Year must be between 1800 and 2100.');
    else if (month < 1 || month > 12) errors.push('Month must be between 01 and 12.');
    else if (day < 1 || day > daysInMonth(year, month)) {
      errors.push('That day does not exist in the calendar.');
    }
  }

  const timeMatch = /^(\d{2}):(\d{2})$/.exec(input.time);
  if (!timeMatch) {
    errors.push('Time must be in 24h HH:MM format.');
  } else {
    const hour = Number(timeMatch[1]);
    const minute = Number(timeMatch[2]);
    if (hour > 23 || minute > 59) errors.push('Time must be between 00:00 and 23:59.');
  }

  if (typeof input.utcOffset !== 'number' || !Number.isFinite(input.utcOffset)) {
    errors.push('UTC offset must be a number.');
  } else if (input.utcOffset < -12 || input.utcOffset > 14) {
    errors.push('UTC offset must be between -12 and +14 hours.');
  }

  return errors;
}
