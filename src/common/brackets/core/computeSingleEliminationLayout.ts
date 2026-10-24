import type { Bracket, BracketMatch } from "./types";

export const BRACKET_LAYOUT = {
  slotWidth: 196,
  slotHeight: 40,
  slotGap: 20,
  roundGap: 72,
  padding: 16,
  roundTitleHeight: 32,
} as const;

/** Card and spacing metrics. Override any of them through `options.layout`. */
export type BracketLayoutMetrics = {
  [Key in keyof typeof BRACKET_LAYOUT]: number;
};

/** Defaults for the score row drawn to the right of each match result. */
export const BRACKET_SCORE_LAYOUT = {
  /**
   * Width of one score cell. Wider than the card so a number can be written
   * in by hand on a printout. Height stays the card height.
   */
  scoreCellWidth: 56,
  /** Gap between score cells, and between the last score cell and the Sum cell. */
  scoreCellGap: 4,
  /** Width of the Sum cell. Room for a handwritten two-digit total. */
  sumCellWidth: 72,
  /** Gap between the result card and the first score cell. */
  scoreStripGap: 12,
} as const;

/**
 * Which rounds get a score row.
 *
 * - `"last"` (default): only the last generated round, plus the third-place
 *   match when there is one (it is played with that final).
 * - `"all"`: every real match.
 * - `{ rounds: number[] }`: these round indexes only (`0` = first round).
 *   Indexes past the last round are ignored; an empty list draws no row.
 */
export type ScoreOn = "last" | "all" | { rounds: number[] };

export type SingleEliminationLayoutOptions = {
  /** Card and spacing metrics. Unset keys use `BRACKET_LAYOUT`. */
  layout?: Partial<BracketLayoutMetrics>;
  /** Number of score cells per match (plus one Sum cell). `0` = no score row. */
  scoreCount?: number;
  /** Rounds that get the score row. Defaults to `"last"`. */
  scoreOn?: ScoreOn;
  /** Width of one score cell. Height stays the card height. */
  scoreCellWidth?: number;
  scoreCellGap?: number;
  sumCellWidth?: number;
  scoreStripGap?: number;
};

export type LayoutRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type LayoutNode = {
  id: string;
  matchId: string;
  roundIndex: number;
  matchIndex: number;
  kind: "slot-item" | "slot-item2" | "outcome";
  rect: LayoutRect;
  visible: boolean;
};

export type LayoutConnector = {
  id: string;
  d: string;
};

export type LayoutHeader = {
  id: string;
  columnIndex: number;
  rect: LayoutRect;
};

export type LayoutScoreCell = {
  id: string;
  matchId: string;
  kind: "score" | "sum";
  /** Zero-based score index; `-1` for the Sum cell. */
  index: number;
  rect: LayoutRect;
};

export type SingleEliminationLayout = {
  width: number;
  height: number;
  nodes: LayoutNode[];
  connectors: LayoutConnector[];
  headers: LayoutHeader[];
  /** Empty unless `scoreCount > 0`. */
  scoreCells: LayoutScoreCell[];
};

type ScoreMetrics = {
  count: number;
  cellWidth: number;
  cellGap: number;
  sumWidth: number;
  stripGap: number;
  /** Width of the cells and gaps after the card (no leading gap). */
  stripWidth: number;
  /** Extra horizontal space a result card with a score row occupies. */
  extra: number;
};

const toCount = (value: number | undefined) => {
  if (value === undefined || !Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.trunc(value));
};

const resolveScoreMetrics = (
  options: SingleEliminationLayoutOptions,
): ScoreMetrics => {
  const count = toCount(options.scoreCount);
  const cellWidth = options.scoreCellWidth ?? BRACKET_SCORE_LAYOUT.scoreCellWidth;
  const cellGap = options.scoreCellGap ?? BRACKET_SCORE_LAYOUT.scoreCellGap;
  const sumWidth = options.sumCellWidth ?? BRACKET_SCORE_LAYOUT.sumCellWidth;
  const stripGap = options.scoreStripGap ?? BRACKET_SCORE_LAYOUT.scoreStripGap;
  const stripWidth =
    count > 0 ? count * cellWidth + count * cellGap + sumWidth : 0;
  return {
    count,
    cellWidth,
    cellGap,
    sumWidth,
    stripGap,
    stripWidth,
    extra: count > 0 ? stripGap + stripWidth : 0,
  };
};

const slotYFor = (metrics: BracketLayoutMetrics) => (slotIndex: number) =>
  metrics.padding +
  metrics.roundTitleHeight +
  slotIndex * (metrics.slotHeight + metrics.slotGap);

/**
 * Column x. Every column that carries a score row pushes the columns after it
 * to the right by the strip width (`scoreExtra`).
 */
const columnXFor =
  (
    metrics: BracketLayoutMetrics,
    scoreExtra: number,
    stripColumns: ReadonlySet<number>,
  ) =>
  (columnIndex: number) => {
    let shift = 0;
    stripColumns.forEach((stripColumn) => {
      if (stripColumn < columnIndex) {
        shift += scoreExtra;
      }
    });
    return (
      metrics.padding +
      columnIndex * (metrics.slotWidth + metrics.roundGap) +
      shift
    );
  };

const matchSlotSpan = (roundIndex: number, matchIndex: number) => {
  const span = 2 ** (roundIndex + 1);
  const start = matchIndex * span;
  return { start, span };
};

const outcomeYFor =
  (metrics: BracketLayoutMetrics) =>
  (roundIndex: number, matchIndex: number) => {
    const slotY = slotYFor(metrics);
    const { start, span } = matchSlotSpan(roundIndex, matchIndex);
    const top = slotY(start);
    const bottom = slotY(start + span - 1) + metrics.slotHeight;
    return (top + bottom) / 2 - metrics.slotHeight / 2;
  };

const rectAtFor =
  (metrics: BracketLayoutMetrics) =>
  (x: number, y: number): LayoutRect => ({
    x,
    y,
    width: metrics.slotWidth,
    height: metrics.slotHeight,
  });

const centerY = (rect: LayoutRect) => rect.y + rect.height / 2;
const rightX = (rect: LayoutRect) => rect.x + rect.width;

const forkPath = (fromA: LayoutRect, fromB: LayoutRect, to: LayoutRect) => {
  const midX = (rightX(fromA) + to.x) / 2;
  const aY = centerY(fromA);
  const bY = centerY(fromB);
  const tY = centerY(to);
  return [
    `M ${rightX(fromA)} ${aY} H ${midX}`,
    `M ${rightX(fromB)} ${bY} H ${midX}`,
    `M ${midX} ${aY} V ${bY}`,
    `M ${midX} ${tY} H ${to.x}`,
  ].join(" ");
};

const stemPath = (from: LayoutRect, to: LayoutRect) => {
  const midX = (rightX(from) + to.x) / 2;
  return `M ${rightX(from)} ${centerY(from)} H ${midX} V ${centerY(to)} H ${to.x}`;
};

const slotNodeId = (matchId: string, side: "item" | "item2") =>
  `${matchId}-${side}`;
const outcomeNodeId = (matchId: string) => `${matchId}-out`;

export const computeSingleEliminationLayout = <T,>(
  bracket: Bracket<T>,
  options: SingleEliminationLayoutOptions = {},
): SingleEliminationLayout => {
  const metrics: BracketLayoutMetrics = {
    ...BRACKET_LAYOUT,
    ...options.layout,
  };
  const slotY = slotYFor(metrics);
  const outcomeY = outcomeYFor(metrics);
  const rectAt = rectAtFor(metrics);
  const score = resolveScoreMetrics(options);
  const firstRound = bracket.rounds[0];

  // Which rounds get a score row, decided from match data before any position
  // is computed (positions depend on which columns carry a strip).
  const scoreOn = options.scoreOn ?? "last";
  const lastRoundIndex = bracket.rounds.length - 1;
  const isRoundSelected = (roundIndex: number) => {
    if (scoreOn === "all") {
      return true;
    }
    if (scoreOn === "last") {
      return roundIndex === lastRoundIndex;
    }
    return scoreOn.rounds.includes(roundIndex);
  };
  const scoredMatchIds = new Set<string>();
  if (score.count > 0) {
    bracket.rounds.forEach((round, roundIndex) => {
      if (!isRoundSelected(roundIndex)) {
        return;
      }
      round.matches.forEach((match) => {
        if (!match.data.isBye) {
          scoredMatchIds.add(match.id);
        }
      });
    });
    // The third-place match is played with the final, so it follows that round.
    if (bracket.thirdPlace && isRoundSelected(lastRoundIndex)) {
      scoredMatchIds.add(bracket.thirdPlace.id);
    }
  }
  // Result column of round r is column r + 1; third place shares the final's column.
  const stripColumns = new Set<number>();
  bracket.rounds.forEach((round, roundIndex) => {
    if (round.matches.some((match) => scoredMatchIds.has(match.id))) {
      stripColumns.add(roundIndex + 1);
    }
  });
  const columnX = columnXFor(metrics, score.extra, stripColumns);
  const paddedSize = firstRound.matches.length * 2;
  const nodes: LayoutNode[] = [];

  firstRound.matches.forEach((match, matchIndex) => {
    const topSlot = matchIndex * 2;
    nodes.push({
      id: slotNodeId(match.id, "item"),
      matchId: match.id,
      roundIndex: 0,
      matchIndex,
      kind: "slot-item",
      rect: rectAt(columnX(0), slotY(topSlot)),
      visible: !match.data.isBye && match.item.kind === "item",
    });
    nodes.push({
      id: slotNodeId(match.id, "item2"),
      matchId: match.id,
      roundIndex: 0,
      matchIndex,
      kind: "slot-item2",
      rect: rectAt(columnX(0), slotY(topSlot + 1)),
      visible: !match.data.isBye && match.item2.kind === "item",
    });
  });

  bracket.rounds.forEach((round, roundIndex) => {
    round.matches.forEach((match, matchIndex) => {
      nodes.push({
        id: outcomeNodeId(match.id),
        matchId: match.id,
        roundIndex,
        matchIndex,
        kind: "outcome",
        rect: rectAt(columnX(roundIndex + 1), outcomeY(roundIndex, matchIndex)),
        visible: true,
      });
    });
  });

  const finalMatch = bracket.rounds.at(-1)?.matches[0];
  const finalOutcome = finalMatch
    ? nodes.find((node) => node.id === outcomeNodeId(finalMatch.id))
    : undefined;

  if (bracket.thirdPlace && finalOutcome) {
    const bronzeMatch = bracket.thirdPlace;
    const mainBottom = nodes
      .filter((node) => node.visible)
      .reduce(
        (bottom, node) => Math.max(bottom, node.rect.y + node.rect.height),
        0,
      );
    const bronzeSlotY = mainBottom + metrics.slotGap;
    const bronzeOutcomeY =
      bronzeSlotY + (metrics.slotHeight + metrics.slotGap) / 2;
    const slotColumn = columnX(bracket.rounds.length - 1);
    const outcomeColumn = columnX(bracket.rounds.length);

    nodes.push({
      id: slotNodeId(bronzeMatch.id, "item"),
      matchId: bronzeMatch.id,
      roundIndex: bracket.rounds.length,
      matchIndex: 0,
      kind: "slot-item",
      rect: rectAt(slotColumn, bronzeSlotY),
      visible: true,
    });
    nodes.push({
      id: slotNodeId(bronzeMatch.id, "item2"),
      matchId: bronzeMatch.id,
      roundIndex: bracket.rounds.length,
      matchIndex: 1,
      kind: "slot-item2",
      rect: rectAt(
        slotColumn,
        bronzeSlotY + metrics.slotHeight + metrics.slotGap,
      ),
      visible: true,
    });
    nodes.push({
      id: outcomeNodeId(bronzeMatch.id),
      matchId: bronzeMatch.id,
      roundIndex: bracket.rounds.length,
      matchIndex: 0,
      kind: "outcome",
      rect: rectAt(outcomeColumn, bronzeOutcomeY),
      visible: true,
    });
  }

  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const connectors: LayoutConnector[] = [];

  const hasScoreRow = (node: LayoutNode) =>
    node.kind === "outcome" && node.visible && scoredMatchIds.has(node.matchId);

  /** Connectors leave from the right edge of the score row when there is one. */
  const connectorRect = (node: LayoutNode): LayoutRect =>
    hasScoreRow(node)
      ? { ...node.rect, width: node.rect.width + score.extra }
      : node.rect;

  const addForkOrStem = (
    connectorId: string,
    fromNodes: LayoutNode[],
    to: LayoutNode,
  ) => {
    const visibleFrom = fromNodes.filter((node) => node.visible);
    if (visibleFrom.length === 0 || !to.visible) {
      return;
    }
    if (visibleFrom.length === 1) {
      connectors.push({
        id: connectorId,
        d: stemPath(connectorRect(visibleFrom[0]), to.rect),
      });
      return;
    }
    connectors.push({
      id: connectorId,
      d: forkPath(
        connectorRect(visibleFrom[0]),
        connectorRect(visibleFrom[1]),
        to.rect,
      ),
    });
  };

  const scoreCells: LayoutScoreCell[] = [];
  nodes.filter(hasScoreRow).forEach((node) => {
    const startX = rightX(node.rect) + score.stripGap;
    for (let index = 0; index < score.count; index += 1) {
      scoreCells.push({
        id: `${node.matchId}-score-${index}`,
        matchId: node.matchId,
        kind: "score",
        index,
        rect: {
          x: startX + index * (score.cellWidth + score.cellGap),
          y: node.rect.y,
          width: score.cellWidth,
          height: node.rect.height,
        },
      });
    }
    scoreCells.push({
      id: `${node.matchId}-sum`,
      matchId: node.matchId,
      kind: "sum",
      index: -1,
      rect: {
        x: startX + score.count * (score.cellWidth + score.cellGap),
        y: node.rect.y,
        width: score.sumWidth,
        height: node.rect.height,
      },
    });
  });

  firstRound.matches.forEach((match) => {
    if (match.data.isBye) {
      return;
    }
    const from = [
      nodeById.get(slotNodeId(match.id, "item")),
      nodeById.get(slotNodeId(match.id, "item2")),
    ].filter((node): node is LayoutNode => Boolean(node));
    const to = nodeById.get(outcomeNodeId(match.id));
    if (to) {
      addForkOrStem(`${match.id}-in`, from, to);
    }
  });

  bracket.rounds.slice(1).forEach((round) => {
    round.matches.forEach((match, matchIndex) => {
      const previousRound = bracket.rounds[round.index - 1];
      const childA: BracketMatch<T> | undefined =
        previousRound.matches[matchIndex * 2];
      const childB: BracketMatch<T> | undefined =
        previousRound.matches[matchIndex * 2 + 1];
      const from = [childA, childB]
        .filter((child): child is BracketMatch<T> => Boolean(child))
        .map((child) => nodeById.get(outcomeNodeId(child.id)))
        .filter((node): node is LayoutNode => Boolean(node));
      const to = nodeById.get(outcomeNodeId(match.id));
      if (to) {
        addForkOrStem(`${match.id}-in`, from, to);
      }
    });
  });

  if (bracket.thirdPlace) {
    const from = [
      nodeById.get(slotNodeId(bracket.thirdPlace.id, "item")),
      nodeById.get(slotNodeId(bracket.thirdPlace.id, "item2")),
    ].filter((node): node is LayoutNode => Boolean(node));
    const to = nodeById.get(outcomeNodeId(bracket.thirdPlace.id));
    if (to) {
      addForkOrStem(`${bracket.thirdPlace.id}-in`, from, to);
    }
  }

  const paddedHeight =
    metrics.padding * 2 +
    metrics.roundTitleHeight +
    paddedSize * metrics.slotHeight +
    (paddedSize - 1) * metrics.slotGap;
  const bronzeBottom = bracket.thirdPlace
    ? (nodeById.get(slotNodeId(bracket.thirdPlace.id, "item2"))?.rect.y ?? 0) +
      metrics.slotHeight +
      metrics.padding
    : 0;
  const columnCount = bracket.rounds.length + 1;
  const headers: LayoutHeader[] = Array.from(
    { length: columnCount },
    (_, columnIndex) => ({
      id: `round-${columnIndex}`,
      columnIndex,
      rect: {
        x: columnX(columnIndex),
        y: metrics.padding,
        width: metrics.slotWidth,
        height: metrics.roundTitleHeight,
      },
    }),
  );

  return {
    width:
      metrics.padding * 2 +
      columnCount * metrics.slotWidth +
      (columnCount - 1) * metrics.roundGap +
      stripColumns.size * score.extra,
    height: Math.max(paddedHeight, bronzeBottom),
    scoreCells,
    nodes,
    connectors,
    headers,
  };
};
