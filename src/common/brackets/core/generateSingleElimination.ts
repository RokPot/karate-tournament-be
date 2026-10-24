import type { Bracket, BracketMatch, BracketRound, BracketSlot } from "./types";

const MIN_PARTICIPANTS = 2;
const MAX_PARTICIPANTS = 256;

export const nextPowerOfTwo = (value: number): number =>
  2 ** Math.ceil(Math.log2(value));

export const getSeedOrder = (paddedSize: number): number[] => {
  let seeds = [1, 2];
  while (seeds.length < paddedSize) {
    const roundSize = seeds.length * 2;
    const next: number[] = [];
    for (const seed of seeds) {
      next.push(seed);
      next.push(roundSize + 1 - seed);
    }
    seeds = next;
  }
  return seeds;
};

const matchId = (roundIndex: number, matchIndex: number) =>
  `r${roundIndex}-m${matchIndex}`;

const roundId = (roundIndex: number) => `r${roundIndex}`;

const slotFromSeed = <T,>(seed: number, participants: T[]): BracketSlot<T> => {
  if (seed > participants.length) {
    return { kind: "bye" };
  }
  return { kind: "item", item: participants[seed - 1] };
};

const slotFromChild = <T,>(child: BracketMatch<T>): BracketSlot<T> => {
  if (child.data.isBye) {
    const winnerItem = child.data.winner === "item2" ? child.item2 : child.item;
    if (winnerItem.kind === "item") {
      return winnerItem;
    }
  }
  return { kind: "tbd", fromMatchId: child.id, outcome: "winner" };
};

/**
 * Where generation stops. Rounds are counted on the padded bracket size.
 *
 * - `{ fromEnd: n }`: stop `n` rounds before the final. `0` = final (full tree),
 *   `1` = second-to-last round, `2` = third-to-last round. For 8 teams
 *   `fromEnd: 2` keeps only the quarterfinals (one round); for 16 teams it keeps
 *   the round of 16 and the quarterfinals.
 * - `{ round: n }`: stop at absolute round index `n` (`0` = first round).
 *
 * Out-of-range values are clamped (`fromEnd` too large keeps only the first
 * round, `round` past the final keeps the full tree). Negative or non-integer
 * values throw.
 */
export type BracketStopAt = { fromEnd: number } | { round: number };

export type GenerateSingleEliminationOptions = {
  includeThirdPlace?: boolean;
  stopAt?: BracketStopAt;
  /**
   * When the real participant count is at most this number, only the first
   * round is generated (same as `stopAt: { round: 0 }`). Example: `5` keeps
   * fields of 2-5 as a single layer. Not set by default, so fields stay full
   * trees. If `stopAt` also applies, the earlier cutoff wins.
   */
  singleLayerWhenAtMost?: number;
};

const assertNonNegativeInteger = (value: number, name: string) => {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`stopAt.${name} must be a non-negative integer.`);
  }
};

/** Index of the last round to generate, clamped into `[0, roundCount - 1]`. */
export const resolveLastRoundIndex = (
  roundCount: number,
  stopAt?: BracketStopAt,
): number => {
  const finalIndex = roundCount - 1;
  if (!stopAt) {
    return finalIndex;
  }
  if ("fromEnd" in stopAt) {
    assertNonNegativeInteger(stopAt.fromEnd, "fromEnd");
    return Math.max(0, finalIndex - stopAt.fromEnd);
  }
  assertNonNegativeInteger(stopAt.round, "round");
  return Math.min(finalIndex, stopAt.round);
};

export const generateSingleElimination = <T,>(
  participants: T[],
  getId: (item: T) => string,
  options: GenerateSingleEliminationOptions = {},
): Bracket<T> => {
  const size = participants.length;
  if (size < MIN_PARTICIPANTS) {
    throw new Error(
      `Single elimination needs at least ${MIN_PARTICIPANTS} participants.`,
    );
  }
  if (size > MAX_PARTICIPANTS) {
    throw new Error(
      `Single elimination supports at most ${MAX_PARTICIPANTS} participants.`,
    );
  }

  const uniqueIds = new Set(participants.map(getId));
  if (uniqueIds.size !== size) {
    throw new Error("Participants must have unique ids.");
  }

  const paddedSize = nextPowerOfTwo(size);
  const fullRoundCount = Math.log2(paddedSize);
  const { singleLayerWhenAtMost } = options;
  if (
    singleLayerWhenAtMost !== undefined &&
    (!Number.isInteger(singleLayerWhenAtMost) || singleLayerWhenAtMost < 0)
  ) {
    throw new Error("singleLayerWhenAtMost must be a non-negative integer.");
  }
  const isSingleLayerField =
    singleLayerWhenAtMost !== undefined && size <= singleLayerWhenAtMost;
  const lastRoundIndex = Math.min(
    resolveLastRoundIndex(fullRoundCount, options.stopAt),
    isSingleLayerField ? 0 : fullRoundCount - 1,
  );
  const roundCount = lastRoundIndex + 1;
  const isStopped = roundCount < fullRoundCount;
  const seeds = getSeedOrder(paddedSize);

  const firstRoundMatches: BracketMatch<T>[] = [];
  for (let matchIndex = 0; matchIndex < paddedSize / 2; matchIndex += 1) {
    const item = slotFromSeed(seeds[matchIndex * 2], participants);
    const item2 = slotFromSeed(seeds[matchIndex * 2 + 1], participants);
    const itemIsBye = item.kind === "bye";
    const item2IsBye = item2.kind === "bye";
    const isBye = itemIsBye !== item2IsBye;

    let winner: BracketMatch<T>["data"]["winner"] = null;
    if (isBye) {
      winner = itemIsBye ? "item2" : "item";
    }

    firstRoundMatches.push({
      id: matchId(0, matchIndex),
      item,
      item2,
      data: { winner, isBye },
    });
  }

  const rounds: BracketRound<T>[] = [
    { id: roundId(0), index: 0, matches: firstRoundMatches },
  ];

  let previousMatches = firstRoundMatches;
  for (let roundIndex = 1; roundIndex < roundCount; roundIndex += 1) {
    const matches: BracketMatch<T>[] = [];
    const matchCount = paddedSize / 2 ** (roundIndex + 1);
    for (let matchIndex = 0; matchIndex < matchCount; matchIndex += 1) {
      const childA = previousMatches[matchIndex * 2];
      const childB = previousMatches[matchIndex * 2 + 1];
      matches.push({
        id: matchId(roundIndex, matchIndex),
        item: slotFromChild(childA),
        item2: slotFromChild(childB),
        data: { winner: null, isBye: false },
      });
    }
    rounds.push({ id: roundId(roundIndex), index: roundIndex, matches });
    previousMatches = matches;
  }

  const semiRound = rounds.length >= 2 ? rounds[rounds.length - 2] : undefined;
  const canPlayThirdPlace =
    Boolean(options.includeThirdPlace) &&
    !isStopped &&
    semiRound?.matches.length === 2 &&
    semiRound.matches.every((match) => !match.data.isBye);

  return {
    kind: "single_elimination",
    size,
    rounds,
    ...(options.stopAt || isSingleLayerField
      ? {
          stop: {
            fromEnd: fullRoundCount - 1 - lastRoundIndex,
            lastRoundIndex,
          },
        }
      : {}),
    ...(canPlayThirdPlace && semiRound
      ? {
          thirdPlace: {
            id: "third-place",
            item: {
              kind: "tbd" as const,
              fromMatchId: semiRound.matches[0].id,
              outcome: "loser" as const,
            },
            item2: {
              kind: "tbd" as const,
              fromMatchId: semiRound.matches[1].id,
              outcome: "loser" as const,
            },
            data: { winner: null, isBye: false },
          },
        }
      : {}),
  };
};
