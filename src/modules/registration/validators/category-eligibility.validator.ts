import { BadRequestException } from '@nestjs/common';

import { CategoryGender, Gender } from '~common/enums';

import { isBeltInRange } from '~common/utils/belt-level.utils';
import { coerceDateOfBirthFromDb } from '~common/utils/date-only.utils';

import { effectiveCategoryLimit } from '../../category/category-limit.utils';
import { type Category } from '../../category/category.entity';
import { type User } from '../../user/user.entity';

/**
 * Category age limits use calendar year of the tournament (not completed years before birthday).
 */
export function ageInCalendarYear(dateOfBirth: Date, refDate: Date): number {
  return refDate.getFullYear() - dateOfBirth.getFullYear();
}

function toNumber(value: number | string | null | undefined): number | null {
  if (value == null) return null;
  if (typeof value === 'string') return parseFloat(value);
  return value;
}

/**
 * Both bounds inclusive: ageMin <= age <= ageMax (null bound = no limit).
 */
export function isAgeWithinCategoryLimits(
  age: number,
  ageMin: number | null,
  ageMax: number | null,
): boolean {
  if (ageMin != null && age < ageMin) {
    return false;
  }
  if (ageMax != null && age > ageMax) {
    return false;
  }
  return true;
}

function userGenderMatchesCategory(userGender: Gender, categoryGender: CategoryGender): boolean {
  if (categoryGender === CategoryGender.MALE) {
    return userGender === Gender.MALE;
  }
  if (categoryGender === CategoryGender.FEMALE) {
    return userGender === Gender.FEMALE;
  }
  return false;
}

/**
 * Returns the first eligibility failure message, or null if the user fits the category.
 * Used for descriptive validation errors and for the boolean userFitsCategory check.
 */
function getUserCategoryEligibilityFailure(
  user: User,
  category: Category,
  effectiveWeight: number | null | undefined,
  ageAtDateRef: Date,
): string | null {
  const weightMin = toNumber(effectiveCategoryLimit(category.weightMin));
  const weightMax = toNumber(effectiveCategoryLimit(category.weightMax));

  if (weightMin != null || weightMax != null) {
    const weight = effectiveWeight ?? null;
    if (weight == null) {
      return 'Weight is required for this category. Please provide weight or final weight.';
    }
    const w = typeof weight === 'string' ? parseFloat(weight) : weight;
    if (weightMin != null && w < weightMin) {
      return `User weight (${w} kg) is below category minimum (${weightMin} kg)`;
    }
    if (weightMax != null && w > weightMax) {
      return `User weight (${w} kg) is above category maximum (${weightMax} kg)`;
    }
  }

  const ageMin = effectiveCategoryLimit(category.ageMin);
  const ageMax = effectiveCategoryLimit(category.ageMax);
  if (ageMin != null || ageMax != null) {
    const dateOfBirth = coerceDateOfBirthFromDb(user.dateOfBirth);
    if (!dateOfBirth) {
      return 'Date of birth is required to check category age limits';
    }
    const age = ageInCalendarYear(dateOfBirth, ageAtDateRef);
    if (!isAgeWithinCategoryLimits(age, ageMin, ageMax)) {
      if (ageMin != null && age < ageMin) {
        return `User age (${age}) is below category minimum (${ageMin})`;
      }
      if (ageMax != null && age > ageMax) {
        return `User age (${age}) is above category maximum (${ageMax})`;
      }
    }
  }

  const beltMin = category.beltMin ?? null;
  const beltMax = category.beltMax ?? null;
  if (beltMin != null || beltMax != null) {
    if (!user.beltLevel) {
      return 'Belt level is required to register for this category';
    }
    if (beltMin != null && beltMax != null) {
      if (!isBeltInRange(user.beltLevel, beltMin, beltMax)) {
        return `User belt level (${user.beltLevel}) is not within category range (${beltMin} - ${beltMax})`;
      }
    } else if (beltMin != null && !isBeltInRange(user.beltLevel, beltMin, beltMin)) {
      return `User belt level (${user.beltLevel}) is below category minimum (${beltMin})`;
    } else if (beltMax != null && !isBeltInRange(user.beltLevel, beltMax, beltMax)) {
      return `User belt level (${user.beltLevel}) is above category maximum (${beltMax})`;
    }
  }

  const categoryGender = category.gender ?? null;
  if (categoryGender != null) {
    if (!user.gender) {
      return 'Gender is required to register for this category';
    }
    if (!userGenderMatchesCategory(user.gender, categoryGender)) {
      return `User gender (${user.gender}) does not match category gender (${categoryGender})`;
    }
  }

  return null;
}

/**
 * Returns whether the user fits the category's weight, age, belt, and gender rules.
 * Same logic as validateUserFitsCategory but returns boolean for filtering.
 */
export function userFitsCategory(
  user: User,
  category: Category,
  effectiveWeight: number | null | undefined,
  ageAtDateRef: Date,
): boolean {
  return getUserCategoryEligibilityFailure(user, category, effectiveWeight, ageAtDateRef) === null;
}

/**
 * Validates that the user fits the category's weight, age, belt, and gender rules.
 * Throws BadRequestException with a descriptive message when the user does not fit.
 */
export function validateUserFitsCategory(
  user: User,
  category: Category,
  effectiveWeight: number | null | undefined,
  ageAtDateRef: Date,
): void {
  const message = getUserCategoryEligibilityFailure(user, category, effectiveWeight, ageAtDateRef);
  if (message !== null) {
    throw new BadRequestException(message);
  }
}
