import {
  BRACKET_LAYOUT,
  BRACKET_SCORE_LAYOUT,
  computeSingleEliminationLayout,
} from "./computeSingleEliminationLayout";
import { generateSingleElimination } from "./generateSingleElimination";

type Team = { id: string; name: string };

const teams = (count: number): Team[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `t${index + 1}`,
    name: `Team ${index + 1}`,
  }));

const getId = (team: Team) => team.id;

describe("computeSingleEliminationLayout score row", () => {
  it("adds no score cells by default", () => {
    const bracket = generateSingleElimination(teams(8), getId);
    const layout = computeSingleEliminationLayout(bracket);
    expect(layout.scoreCells).toEqual([]);
  });

  it("keeps the layout size unchanged when scoreCount is 0", () => {
    const bracket = generateSingleElimination(teams(8), getId);
    const plain = computeSingleEliminationLayout(bracket);
    const zero = computeSingleEliminationLayout(bracket, { scoreCount: 0 });
    expect(zero.width).toBe(plain.width);
    expect(zero.height).toBe(plain.height);
  });

  it("draws X score cells and one sum cell for each real match", () => {
    const bracket = generateSingleElimination(teams(8), getId, {
      stopAt: { fromEnd: 2 },
    });
    const layout = computeSingleEliminationLayout(bracket, { scoreCount: 5 });

    expect(bracket.rounds).toHaveLength(1);
    expect(layout.scoreCells).toHaveLength(4 * (5 + 1));
    const first = layout.scoreCells.filter(
      (cell) => cell.matchId === bracket.rounds[0].matches[0].id,
    );
    expect(first.map((cell) => cell.kind)).toEqual([
      "score",
      "score",
      "score",
      "score",
      "score",
      "sum",
    ]);
    expect(first.map((cell) => cell.index)).toEqual([0, 1, 2, 3, 4, -1]);
  });

  it("places the strip to the right of the result card on the same row", () => {
    const bracket = generateSingleElimination(teams(2), getId);
    const layout = computeSingleEliminationLayout(bracket, { scoreCount: 3 });
    const outcome = layout.nodes.find((node) => node.kind === "outcome");
    expect(outcome).toBeDefined();
    const cells = layout.scoreCells;
    expect(cells[0].rect.x).toBe(
      (outcome?.rect.x ?? 0) +
        BRACKET_LAYOUT.slotWidth +
        BRACKET_SCORE_LAYOUT.scoreStripGap,
    );
    cells.forEach((cell) => {
      const centerY = cell.rect.y + cell.rect.height / 2;
      expect(centerY).toBe(
        (outcome?.rect.y ?? 0) + BRACKET_LAYOUT.slotHeight / 2,
      );
    });
  });

  it("draws score cells wider than the card so a number can be written in", () => {
    const bracket = generateSingleElimination(teams(4), getId);
    const layout = computeSingleEliminationLayout(bracket, { scoreCount: 5 });
    const scoreCells = layout.scoreCells.filter((cell) => cell.kind === "score");
    expect(scoreCells.length).toBeGreaterThan(0);
    scoreCells.forEach((cell) => {
      expect(cell.rect.height).toBe(BRACKET_LAYOUT.slotHeight);
      expect(cell.rect.width).toBe(BRACKET_SCORE_LAYOUT.scoreCellWidth);
      expect(cell.rect.width).toBeGreaterThan(cell.rect.height);
    });
    const sum = layout.scoreCells.find((cell) => cell.kind === "sum");
    expect(sum?.rect.width).toBe(BRACKET_SCORE_LAYOUT.sumCellWidth);
    expect(sum?.rect.width).toBeGreaterThan(BRACKET_LAYOUT.slotHeight);
  });

  it("keeps a custom score cell as tall as the card", () => {
    const bracket = generateSingleElimination(teams(2), getId);
    const layout = computeSingleEliminationLayout(bracket, {
      scoreCount: 2,
      scoreCellWidth: 64,
    });
    const outcome = layout.nodes.find((node) => node.kind === "outcome");
    const [cell] = layout.scoreCells;
    expect(cell.rect.width).toBe(64);
    expect(cell.rect.height).toBe(BRACKET_LAYOUT.slotHeight);
    expect(cell.rect.y).toBe(outcome?.rect.y);
  });

  it("widens the canvas so the strip fits", () => {
    const bracket = generateSingleElimination(teams(4), getId);
    const layout = computeSingleEliminationLayout(bracket, { scoreCount: 5 });
    const maxRight = Math.max(
      ...layout.scoreCells.map((cell) => cell.rect.x + cell.rect.width),
    );
    expect(layout.width).toBeGreaterThanOrEqual(maxRight);
  });

  it("does not let a score row overlap the next column", () => {
    const bracket = generateSingleElimination(teams(4), getId);
    const layout = computeSingleEliminationLayout(bracket, {
      scoreCount: 5,
      scoreOn: "all",
    });
    const semiFinalCells = layout.scoreCells.filter((cell) =>
      bracket.rounds[0].matches.some((match) => match.id === cell.matchId),
    );
    const stripRight = Math.max(
      ...semiFinalCells.map((cell) => cell.rect.x + cell.rect.width),
    );
    const finalOutcome = layout.nodes.find(
      (node) =>
        node.kind === "outcome" &&
        node.matchId === bracket.rounds[1].matches[0].id,
    );
    expect(finalOutcome?.rect.x).toBeGreaterThan(stripRight);
  });

  it("skips bye matches", () => {
    const bracket = generateSingleElimination(teams(5), getId, {
      stopAt: { round: 0 },
    });
    const byes = bracket.rounds[0].matches.filter((m) => m.data.isBye);
    expect(byes.length).toBeGreaterThan(0);
    const layout = computeSingleEliminationLayout(bracket, { scoreCount: 2 });
    byes.forEach((bye) => {
      expect(
        layout.scoreCells.some((cell) => cell.matchId === bye.id),
      ).toBe(false);
    });
    expect(layout.scoreCells).toHaveLength(
      (bracket.rounds[0].matches.length - byes.length) * 3,
    );
  });

  it("adds a score row to the third-place match", () => {
    const bracket = generateSingleElimination(teams(4), getId, {
      includeThirdPlace: true,
    });
    const layout = computeSingleEliminationLayout(bracket, { scoreCount: 2 });
    expect(
      layout.scoreCells.some((cell) => cell.matchId === "third-place"),
    ).toBe(true);
  });

  it("honors custom sizes", () => {
    const bracket = generateSingleElimination(teams(2), getId);
    const layout = computeSingleEliminationLayout(bracket, {
      scoreCount: 2,
      scoreCellWidth: 10,
      scoreCellGap: 2,
      sumCellWidth: 20,
      scoreStripGap: 5,
    });
    const [a, b, sum] = layout.scoreCells;
    expect(a.rect.width).toBe(10);
    expect(b.rect.x - a.rect.x).toBe(12);
    expect(sum.rect.width).toBe(20);
    expect(sum.rect.x - b.rect.x).toBe(12);
  });

  describe("scoreOn", () => {
    const cellsOfRound = (
      layout: ReturnType<typeof computeSingleEliminationLayout>,
      matchIds: string[],
    ) => layout.scoreCells.filter((cell) => matchIds.includes(cell.matchId));
    const idsOf = (matches: { id: string }[]) => matches.map((m) => m.id);

    it("defaults to the last round only", () => {
      const bracket = generateSingleElimination(teams(16), getId);
      const layout = computeSingleEliminationLayout(bracket, { scoreCount: 5 });
      const lastIds = idsOf(bracket.rounds[3].matches);
      expect(layout.scoreCells).toHaveLength(1 * (5 + 1));
      expect(cellsOfRound(layout, lastIds)).toHaveLength(6);
    });

    it("puts the row on the last remaining round after stopAt", () => {
      const bracket = generateSingleElimination(teams(16), getId, {
        stopAt: { fromEnd: 2 },
      });
      const layout = computeSingleEliminationLayout(bracket, { scoreCount: 5 });
      expect(bracket.rounds).toHaveLength(2);
      expect(cellsOfRound(layout, idsOf(bracket.rounds[0].matches))).toEqual(
        [],
      );
      expect(cellsOfRound(layout, idsOf(bracket.rounds[1].matches))).toHaveLength(
        4 * 6,
      );
    });

    it('draws a row on every real match with "all"', () => {
      const bracket = generateSingleElimination(teams(8), getId);
      const layout = computeSingleEliminationLayout(bracket, {
        scoreCount: 2,
        scoreOn: "all",
      });
      expect(layout.scoreCells).toHaveLength((4 + 2 + 1) * 3);
    });

    it("draws rows on the listed rounds only", () => {
      const bracket = generateSingleElimination(teams(8), getId);
      const layout = computeSingleEliminationLayout(bracket, {
        scoreCount: 2,
        scoreOn: { rounds: [0, 2] },
      });
      expect(cellsOfRound(layout, idsOf(bracket.rounds[0].matches))).toHaveLength(
        4 * 3,
      );
      expect(cellsOfRound(layout, idsOf(bracket.rounds[1].matches))).toEqual([]);
      expect(cellsOfRound(layout, idsOf(bracket.rounds[2].matches))).toHaveLength(
        3,
      );
    });

    it("ignores unknown round indexes and draws nothing for an empty list", () => {
      const bracket = generateSingleElimination(teams(8), getId);
      const unknown = computeSingleEliminationLayout(bracket, {
        scoreCount: 2,
        scoreOn: { rounds: [7] },
      });
      const empty = computeSingleEliminationLayout(bracket, {
        scoreCount: 2,
        scoreOn: { rounds: [] },
      });
      const plain = computeSingleEliminationLayout(bracket);
      expect(unknown.scoreCells).toEqual([]);
      expect(empty.scoreCells).toEqual([]);
      expect(empty.width).toBe(plain.width);
    });

    it("follows the final: third place gets a row with the last round", () => {
      const bracket = generateSingleElimination(teams(8), getId, {
        includeThirdPlace: true,
      });
      const last = computeSingleEliminationLayout(bracket, { scoreCount: 2 });
      expect(last.scoreCells).toHaveLength(2 * 3);
      expect(
        last.scoreCells.some((cell) => cell.matchId === "third-place"),
      ).toBe(true);

      const early = computeSingleEliminationLayout(bracket, {
        scoreCount: 2,
        scoreOn: { rounds: [0] },
      });
      expect(
        early.scoreCells.some((cell) => cell.matchId === "third-place"),
      ).toBe(false);
    });

    it("widens only the columns that carry a row", () => {
      const bracket = generateSingleElimination(teams(16), getId);
      const plain = computeSingleEliminationLayout(bracket);
      const extra =
        BRACKET_SCORE_LAYOUT.scoreStripGap +
        5 * BRACKET_SCORE_LAYOUT.scoreCellWidth +
        4 * BRACKET_SCORE_LAYOUT.scoreCellGap +
        BRACKET_SCORE_LAYOUT.scoreCellGap +
        BRACKET_SCORE_LAYOUT.sumCellWidth;
      const last = computeSingleEliminationLayout(bracket, { scoreCount: 5 });
      const all = computeSingleEliminationLayout(bracket, {
        scoreCount: 5,
        scoreOn: "all",
      });
      expect(last.width).toBe(plain.width + extra);
      expect(all.width).toBe(plain.width + 4 * extra);
    });

    it("keeps earlier columns where they were when only the last round has a row", () => {
      const bracket = generateSingleElimination(teams(16), getId);
      const plain = computeSingleEliminationLayout(bracket);
      const last = computeSingleEliminationLayout(bracket, { scoreCount: 5 });
      const xOf = (layout: typeof plain, matchId: string) =>
        layout.nodes.find(
          (node) => node.matchId === matchId && node.kind === "outcome",
        )?.rect.x;
      bracket.rounds.slice(0, 3).forEach((round) => {
        round.matches.forEach((match) => {
          expect(xOf(last, match.id)).toBe(xOf(plain, match.id));
        });
      });
    });
  });

  it("treats invalid counts as no score row", () => {
    const bracket = generateSingleElimination(teams(2), getId);
    expect(
      computeSingleEliminationLayout(bracket, { scoreCount: Number.NaN })
        .scoreCells,
    ).toEqual([]);
    expect(
      computeSingleEliminationLayout(bracket, { scoreCount: -3 }).scoreCells,
    ).toEqual([]);
  });
});

describe("computeSingleEliminationLayout layout override", () => {
  it("matches the defaults when no override is given", () => {
    const bracket = generateSingleElimination(teams(8), getId);
    const plain = computeSingleEliminationLayout(bracket);
    const explicit = computeSingleEliminationLayout(bracket, {
      layout: { ...BRACKET_LAYOUT },
    });
    expect(explicit).toEqual(plain);
  });

  it("uses an overridden card height for nodes and the canvas height", () => {
    const bracket = generateSingleElimination(teams(8), getId);
    const plain = computeSingleEliminationLayout(bracket);
    const taller = computeSingleEliminationLayout(bracket, {
      layout: { slotHeight: 48 },
    });

    expect(taller.nodes.every((node) => node.rect.height === 48)).toBe(true);
    expect(taller.height).toBe(plain.height + 8 * 8);
    expect(taller.width).toBe(plain.width);
  });
});
