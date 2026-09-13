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

export type GenerateSingleEliminationOptions = {
  includeThirdPlace?: boolean;
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
  const roundCount = Math.log2(paddedSize);
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
    semiRound?.matches.length === 2 &&
    semiRound.matches.every((match) => !match.data.isBye);

  return {
    kind: "single_elimination",
    size,
    rounds,
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
