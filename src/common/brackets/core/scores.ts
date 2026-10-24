import type { BracketScoreValue } from "./types";

const toNumber = (value: BracketScoreValue): number | undefined => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

/**
 * Total of a score row. Returns a number only when every expected cell holds a
 * numeric value; otherwise `undefined` (the Sum cell stays blank).
 *
 * @param scores   Score cells of one match side/row.
 * @param expected Number of cells that must be filled. Defaults to `scores.length`.
 */
export const sumScores = (
  scores: ReadonlyArray<BracketScoreValue> | null | undefined,
  expected: number = scores?.length ?? 0,
): number | undefined => {
  if (!scores || expected <= 0 || scores.length < expected) {
    return undefined;
  }
  let total = 0;
  for (let index = 0; index < expected; index += 1) {
    const value = toNumber(scores[index]);
    if (value === undefined) {
      return undefined;
    }
    total += value;
  }
  return total;
};

export type ResolvedSum = number | string | undefined;

/**
 * What the Sum cell shows: an explicit `sum` wins, then the computed total,
 * then `undefined` (the renderer shows the sum label).
 */
export const resolveSum = (
  scores: ReadonlyArray<BracketScoreValue> | null | undefined,
  sum: BracketScoreValue,
  expected?: number,
): ResolvedSum => {
  if (sum !== null && sum !== undefined && sum !== "") {
    return sum;
  }
  return sumScores(scores, expected);
};
