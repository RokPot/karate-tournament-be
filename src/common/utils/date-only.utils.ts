const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATE_TIME_PREFIX_PATTERN = /^(\d{4}-\d{2}-\d{2})(?:T|$)/;
const EUROPEAN_DATE_PATTERN = /^\d{1,2}\.\d{1,2}\.\d{4}$/;

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function toLocalDate(year: number, month: number, day: number): Date {
  if (month < 1 || month > 12) {
    throw new Error(`Invalid date of birth: month ${month} is out of range`);
  }
  const maxDay = daysInMonth(year, month);
  if (day < 1 || day > maxDay) {
    throw new Error(`Invalid date of birth: day ${day} is out of range for ${month}/${year}`);
  }
  return new Date(year, month - 1, day);
}

function parseIsoDateParts(year: number, month: number, day: number): Date {
  return toLocalDate(year, month, day);
}

/**
 * Returns true when the string is a supported date-of-birth format and forms a valid calendar date.
 */
export function isDateOfBirthString(value: unknown): boolean {
  if (typeof value !== 'string' || value.trim() === '') {
    return false;
  }
  try {
    parseDateOfBirth(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Parses date of birth from:
 * - ISO date-time (2018-02-02T00:00:00.000Z) — calendar date taken from the date portion
 * - ISO date (YYYY-MM-DD)
 * - European dotted form (D.M.YYYY)
 */
export function parseDateOfBirth(value: string): Date {
  const trimmed = value.trim();

  const isoDateTimeMatch = trimmed.match(ISO_DATE_TIME_PREFIX_PATTERN);
  if (isoDateTimeMatch) {
    const [year, month, day] = isoDateTimeMatch[1].split('-').map(Number);
    return parseIsoDateParts(year, month, day);
  }

  if (ISO_DATE_PATTERN.test(trimmed)) {
    const [year, month, day] = trimmed.split('-').map(Number);
    return parseIsoDateParts(year, month, day);
  }

  if (EUROPEAN_DATE_PATTERN.test(trimmed)) {
    const [day, month, year] = trimmed.split('.').map(Number);
    return parseIsoDateParts(year, month, day);
  }

  throw new Error(
    `Invalid date of birth: "${value}". Expected ISO date-time (e.g. 2018-02-02T00:00:00.000Z), YYYY-MM-DD, or D.M.YYYY (e.g. 7.7.2000).`,
  );
}

/**
 * Parses an ISO date-only string (YYYY-MM-DD). Prefer {@link parseDateOfBirth} for API input.
 */
export function parseDateOnly(value: string): Date {
  return parseDateOfBirth(value);
}

/**
 * Formats a Date as YYYY-MM-DD using local calendar components.
 */
export function formatDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats a Date as European D.M.YYYY (no leading zeros on day/month).
 */
export function formatDateOfBirthEuropean(date: Date): string {
  return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
}

/**
 * Serializes a calendar date as an ISO date-time at UTC midnight (matches response date-time OpenAPI fields).
 */
export function formatDateOnlyAsDateTime(date: Date): string {
  return `${formatDateOnly(date)}T00:00:00.000Z`;
}

/**
 * Normalizes a date-of-birth value from the DB or entity layer (Date or YYYY-MM-DD string).
 */
export function coerceDateOfBirthFromDb(value: Date | string | null | undefined): Date | null {
  if (value == null || value === '') {
    return null;
  }
  if (value instanceof Date) {
    return value;
  }
  return parseDateOfBirth(value);
}

/**
 * Serializes date of birth for API responses (ISO date-time at UTC midnight).
 */
export function formatDateOfBirthForResponse(value: Date | string | null | undefined): string | null {
  const date = coerceDateOfBirthFromDb(value);
  return date ? formatDateOnlyAsDateTime(date) : null;
}
