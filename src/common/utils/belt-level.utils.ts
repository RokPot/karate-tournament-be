import { BeltLevel } from '~common/enums';

/**
 * Explicit order for belt levels (10-kyu = 0, ascending through 10-dan).
 * Used to check if a user's belt is within a category's belt range.
 */
export const BELT_ORDER: Record<BeltLevel, number> = {
  [BeltLevel.KYU_10]: 0,
  [BeltLevel.KYU_9]: 1,
  [BeltLevel.KYU_8]: 2,
  [BeltLevel.KYU_7]: 3,
  [BeltLevel.KYU_6]: 4,
  [BeltLevel.KYU_5]: 5,
  [BeltLevel.KYU_4]: 6,
  [BeltLevel.KYU_3]: 7,
  [BeltLevel.KYU_2]: 8,
  [BeltLevel.KYU_1]: 9,
  [BeltLevel.DAN_1]: 10,
  [BeltLevel.DAN_2]: 11,
  [BeltLevel.DAN_3]: 12,
  [BeltLevel.DAN_4]: 13,
  [BeltLevel.DAN_5]: 14,
  [BeltLevel.DAN_6]: 15,
  [BeltLevel.DAN_7]: 16,
  [BeltLevel.DAN_8]: 17,
  [BeltLevel.DAN_9]: 18,
  [BeltLevel.DAN_10]: 19,
};

/**
 * Returns whether the user's belt is within the category's belt range [beltMin, beltMax] (inclusive),
 * using the explicit BELT_ORDER.
 */
export function isBeltInRange(userBelt: BeltLevel, beltMin: BeltLevel, beltMax: BeltLevel): boolean {
  const order = BELT_ORDER[userBelt];
  const minOrder = BELT_ORDER[beltMin];
  const maxOrder = BELT_ORDER[beltMax];
  return order >= minOrder && order <= maxOrder;
}
