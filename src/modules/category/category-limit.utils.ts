/**
 * For eligibility checks only: `0` or `null` means no limit on this bound.
 * Persisted values are returned as-is from the API (including `0`).
 */
export function effectiveCategoryLimit(value: number | null | undefined): number | null {
  if (value == null || value === 0) {
    return null;
  }
  return value;
}
