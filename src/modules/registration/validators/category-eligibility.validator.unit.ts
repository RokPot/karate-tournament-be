import { describe, expect, it } from 'vitest';

import { Discipline } from '~common/enums';
import { parseDateOfBirth } from '~common/utils/date-only.utils';

import { type Category } from '../../category/category.entity';
import { type User } from '../../user/user.entity';

import { ageInCalendarYear, isAgeWithinCategoryLimits, isFeederOnlyParticipant, userFitsCategory } from './category-eligibility.validator';

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
    feederParticipantLimit: null,
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

describe('isFeederOnlyParticipant', () => {
  const team = categoryWithAgeLimits(10, 12);
  const younger = categoryWithAgeLimits(8, 10);

  it('is true when the athlete misses the team band but fits a feeder', () => {
    const user = userWithDateOfBirthString('2017-02-02');
    expect(ageInCalendarYear(user.dateOfBirth!, refDate)).toBe(9);
    expect(isFeederOnlyParticipant(user, team, [younger], null, refDate)).toBe(true);
  });

  it('is false when the athlete already fits the team category', () => {
    const user = userWithDateOfBirthString('2015-02-02');
    expect(ageInCalendarYear(user.dateOfBirth!, refDate)).toBe(11);
    expect(isFeederOnlyParticipant(user, team, [younger], null, refDate)).toBe(false);
  });

  it('is false when the athlete fits neither category', () => {
    const user = userWithDateOfBirthString('2020-02-02');
    expect(ageInCalendarYear(user.dateOfBirth!, refDate)).toBe(6);
    expect(isFeederOnlyParticipant(user, team, [younger], null, refDate)).toBe(false);
  });
});
