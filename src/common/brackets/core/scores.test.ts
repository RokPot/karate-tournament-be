import { resolveSum, sumScores } from "./scores";

describe("sumScores", () => {
  it("adds numeric cells", () => {
    expect(sumScores([1, 2, 3])).toBe(6);
  });

  it("accepts numeric strings", () => {
    expect(sumScores(["1", 2, " 3 "])).toBe(6);
  });

  it("returns undefined when any expected cell is blank", () => {
    expect(sumScores([1, null, 3])).toBeUndefined();
    expect(sumScores([1, "", 3])).toBeUndefined();
    expect(sumScores([1, undefined, 3])).toBeUndefined();
  });

  it("returns undefined for non-numeric text", () => {
    expect(sumScores([1, "x"])).toBeUndefined();
  });

  it("requires the expected number of cells", () => {
    expect(sumScores([1, 2], 5)).toBeUndefined();
    expect(sumScores([1, 2, 3, 4, 5], 5)).toBe(15);
  });

  it("ignores cells beyond the expected count", () => {
    expect(sumScores([1, 2, 99], 2)).toBe(3);
  });

  it("returns undefined for empty or missing scores", () => {
    expect(sumScores([])).toBeUndefined();
    expect(sumScores(null)).toBeUndefined();
    expect(sumScores(undefined, 5)).toBeUndefined();
  });
});

describe("resolveSum", () => {
  it("prefers an explicit sum", () => {
    expect(resolveSum([1, 2], 10)).toBe(10);
    expect(resolveSum([1, 2], 0)).toBe(0);
  });

  it("falls back to the computed total", () => {
    expect(resolveSum([1, 2], null)).toBe(3);
    expect(resolveSum([1, 2], "")).toBe(3);
  });

  it("is undefined when neither is available", () => {
    expect(resolveSum([1, null], undefined)).toBeUndefined();
  });
});
