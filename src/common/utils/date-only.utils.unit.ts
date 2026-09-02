import { describe, expect, it } from 'vitest';

import {
  formatDateOfBirthEuropean,
  formatDateOfBirthForResponse,
  isDateOfBirthString,
  parseDateOfBirth,
} from './date-only.utils';

describe('parseDateOfBirth', () => {
  it('parses European D.M.YYYY', () => {
    const date = parseDateOfBirth('7.7.2000');
    expect(date.getFullYear()).toBe(2000);
    expect(date.getMonth()).toBe(6);
    expect(date.getDate()).toBe(7);
  });

  it('parses ISO YYYY-MM-DD', () => {
    const date = parseDateOfBirth('2000-07-07');
    expect(date.getFullYear()).toBe(2000);
    expect(date.getMonth()).toBe(6);
    expect(date.getDate()).toBe(7);
  });

  it('parses ISO date-time (registration payload format)', () => {
    const date = parseDateOfBirth('2018-02-02T00:00:00.000Z');
    expect(date.getFullYear()).toBe(2018);
    expect(date.getMonth()).toBe(1);
    expect(date.getDate()).toBe(2);
  });

  it('rejects invalid calendar dates', () => {
    expect(() => parseDateOfBirth('32.1.2000')).toThrow();
    expect(() => parseDateOfBirth('not-a-date')).toThrow();
  });
});

describe('isDateOfBirthString', () => {
  it('accepts valid European and ISO strings', () => {
    expect(isDateOfBirthString('7.7.2000')).toBe(true);
    expect(isDateOfBirthString('2.2.2000')).toBe(true);
    expect(isDateOfBirthString('2000-02-02')).toBe(true);
    expect(isDateOfBirthString('2018-02-02T00:00:00.000Z')).toBe(true);
  });

  it('rejects invalid values', () => {
    expect(isDateOfBirthString('32.1.2000')).toBe(false);
    expect(isDateOfBirthString('')).toBe(false);
  });
});

describe('formatDateOfBirthEuropean', () => {
  it('formats without leading zeros', () => {
    const date = parseDateOfBirth('7.7.2000');
    expect(formatDateOfBirthEuropean(date)).toBe('7.7.2000');
  });
});

describe('formatDateOfBirthForResponse', () => {
  it('serializes a Date', () => {
    expect(formatDateOfBirthForResponse(parseDateOfBirth('2018-02-02'))).toBe('2018-02-02T00:00:00.000Z');
  });

  it('serializes a PostgreSQL date string from the DB', () => {
    expect(formatDateOfBirthForResponse('2018-02-02')).toBe('2018-02-02T00:00:00.000Z');
  });

  it('returns null when missing', () => {
    expect(formatDateOfBirthForResponse(null)).toBeNull();
  });
});
