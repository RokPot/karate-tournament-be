import { describe, expect, it } from 'vitest';

import { Discipline } from '~common/enums';
import { parseDateOfBirth } from '~common/utils/date-only.utils';

import { type Category } from '../../category/category.entity';
import { type User } from '../../user/user.entity';

import { ageInCalendarYear, isAgeWithinCategoryLimits, userFitsCategory } from './category-eligibility.validator';

const refDate = new Date(2026, 4, 20); // 20 May 2026

function categoryWithAgeLimits(ageMin: number | null, ageMax: number | null): Category {
  return {
    id: 'cat-1',
    name: 'Test',
    discipline: Discipline.KATA,
    subDiscipline: null,
    gender: null,
    ageMin,
    ageMax,
    weightMin: null,
    weightMax: null,
    beltMin: null,
    beltMax: null,
    teamSize: null,
    teamReservesSize: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Category;
}

function userWithDateOfBirthString(dateOfBirth: string): User {
  return { dateOfBirth: parseDateOfBirth(dateOfBirth) } as User;
}

describe('ageInCalendarYear', () => {
  it('uses tournament year minus birth year only', () => {
    expect(ageInCalendarYear(parseDateOfBirth('7.7.2000'), refDate)).toBe(26);
    expect(ageInCalendarYear(parseDateOfBirth('2.2.2000'), refDate)).toBe(26);
    expect(ageInCalendarYear(parseDateOfBirth('7.7.2001'), refDate)).toBe(25);
  });
});

describe('isAgeWithinCategoryLimits', () => {
  it('includes both boundary ages (inclusive min and max)', () => {
    expect(isAgeWithinCategoryLimits(10, 0, 10)).toBe(true);
    expect(isAgeWithinCategoryLimits(10, 10, 20)).toBe(true);
    expect(isAgeWithinCategoryLimits(10, 10, 10)).toBe(true);
  });

  it('excludes ages outside the range', () => {
    expect(isAgeWithinCategoryLimits(9, 10, 20)).toBe(false);
    expect(isAgeWithinCategoryLimits(11, 0, 10)).toBe(false);
  });
});

describe('userFitsCategory calendar-year age', () => {
  it('7.7.2000 is age 26 in 2026 and fits 25-30', () => {
    const user = userWithDateOfBirthString('7.7.2000');
    expect(userFitsCategory(user, categoryWithAgeLimits(25, 30), null, refDate)).toBe(true);
  });

  it('7.7.2000 is age 26 in 2026 (not 25 before July birthday)', () => {
    const user = userWithDateOfBirthString('7.7.2000');
    expect(userFitsCategory(user, categoryWithAgeLimits(10, 20), null, refDate)).toBe(true);
    expect(userFitsCategory(user, categoryWithAgeLimits(0, 10), null, refDate)).toBe(false);
  });

  it('7.7.2001 is age 25 in 2026', () => {
    const user = userWithDateOfBirthString('7.7.2001');
    expect(userFitsCategory(user, categoryWithAgeLimits(25, 30), null, refDate)).toBe(true);
    expect(userFitsCategory(user, categoryWithAgeLimits(26, 30), null, refDate)).toBe(false);
  });

  it('2.2.2000 is age 26 in 2026', () => {
    const user = userWithDateOfBirthString('2.2.2000');
    expect(ageInCalendarYear(user.dateOfBirth!, refDate)).toBe(26);
    expect(userFitsCategory(user, categoryWithAgeLimits(26, 30), null, refDate)).toBe(true);
  });

  it('accepts ISO date-time string for date of birth', () => {
    const user = userWithDateOfBirthString('2018-02-02T00:00:00.000Z');
    expect(ageInCalendarYear(user.dateOfBirth!, refDate)).toBe(8);
  });
});
