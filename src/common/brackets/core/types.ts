export type BracketKind = "single_elimination";

export type BracketSlotOutcome = "winner" | "loser";

export type BracketSlot<T> =
  | { kind: "item"; item: T }
  | { kind: "bye" }
  | { kind: "tbd"; fromMatchId: string; outcome: BracketSlotOutcome };

export type BracketMatchWinner = "item" | "item2" | null;

export type BracketScoreValue = number | string | null | undefined;

export type BracketMatch<T> = {
  id: string;
  item: BracketSlot<T>;
  item2: BracketSlot<T>;
  data: {
    winner: BracketMatchWinner;
    metadata?: Record<string, unknown>;
    isBye: boolean;
    score?: number | string | null;
    score2?: number | string | null;
    /** Cells of the score row drawn next to the match result (see `scoreCount`). */
    scores?: BracketScoreValue[] | null;
    /** Explicit total for the score row. When unset the total is computed from `scores`. */
    sum?: number | string | null;
  };
};

export type BracketRound<T> = {
  id: string;
  index: number;
  matches: BracketMatch<T>[];
};

export type BracketStop = {
  /** Rounds cut off after the last generated round (0 = full tree). */
  fromEnd: number;
  /** Index of the last generated round. */
  lastRoundIndex: number;
};

export type Bracket<T> = {
  kind: BracketKind;
  size: number;
  rounds: BracketRound<T>[];
  /** Present only when generation was limited with `stopAt` or `singleLayerWhenAtMost`. */
  stop?: BracketStop;
  thirdPlace?: BracketMatch<T>;
};

export const getSlotItem = <T,>(slot: BracketSlot<T>): T | undefined =>
  slot.kind === "item" ? slot.item : undefined;

export const getMatchWinnerItem = <T,>(match: BracketMatch<T>): T | undefined => {
  if (match.data.winner === "item") {
    return getSlotItem(match.item);
  }
  if (match.data.winner === "item2") {
    return getSlotItem(match.item2);
  }
  return undefined;
};

export const getMatchLoserItem = <T,>(match: BracketMatch<T>): T | undefined => {
  if (match.data.winner === "item") {
    return getSlotItem(match.item2);
  }
  if (match.data.winner === "item2") {
    return getSlotItem(match.item);
  }
  return undefined;
};
