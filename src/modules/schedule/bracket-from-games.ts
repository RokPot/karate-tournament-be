import type { Bracket, BracketMatch, BracketRound, BracketSlot } from '~common/brackets/core';
import { GameSlotKind, GameSlotOutcome, GameWinnerSide } from '~common/enums';

import type { Game } from './game.entity';

export type BracketCompetitor = { id: string; label: string };

const MATCH_KEY = /^r(\d+)-m(\d+)$/;

const mapSlot = (
  kind: GameSlotKind,
  competitorId: string | null,
  fromGameId: string | null,
  outcome: GameSlotOutcome | null,
  keyById: Map<string, string>,
  labels: Map<string, string>,
): BracketSlot<BracketCompetitor> => {
  if (kind === GameSlotKind.ITEM && competitorId) {
    return { kind: 'item', item: { id: competitorId, label: labels.get(competitorId) ?? '—' } };
  }
  if (kind === GameSlotKind.BYE) {
    return { kind: 'bye' };
  }
  return {
    kind: 'tbd',
    fromMatchId: (fromGameId && keyById.get(fromGameId)) || '',
    outcome: outcome === GameSlotOutcome.LOSER ? 'loser' : 'winner',
  };
};

const mapMatch = (
  game: Game,
  keyById: Map<string, string>,
  labels: Map<string, string>,
): BracketMatch<BracketCompetitor> => ({
  id: game.key,
  item: mapSlot(game.slotAKind, game.slotACompetitorId, game.slotAFromGameId, game.slotAOutcome, keyById, labels),
  item2: mapSlot(game.slotBKind, game.slotBCompetitorId, game.slotBFromGameId, game.slotBOutcome, keyById, labels),
  data: {
    winner:
      game.winnerSide === GameWinnerSide.ITEM ? 'item' : game.winnerSide === GameWinnerSide.ITEM2 ? 'item2' : null,
    isBye: game.isBye,
  },
});

/**
 * Rebuilds a drawable `Bracket` from persisted games so the printout always
 * matches the stored schedule. Returns null when the games hold no rounds.
 */
export const buildBracketFromGames = (
  games: Game[],
  labels: Map<string, string>,
): Bracket<BracketCompetitor> | null => {
  const keyById = new Map(games.map((game) => [game.id, game.key] as const));
  const byRound = new Map<number, { matchIndex: number; match: BracketMatch<BracketCompetitor> }[]>();
  let thirdPlace: BracketMatch<BracketCompetitor> | undefined;

  for (const game of games) {
    if (game.isThirdPlace) {
      thirdPlace = mapMatch(game, keyById, labels);
      continue;
    }
    const parsed = MATCH_KEY.exec(game.key);
    if (!parsed) {
      continue;
    }
    const roundIndex = Number(parsed[1]);
    const matchIndex = Number(parsed[2]);
    const list = byRound.get(roundIndex) ?? [];
    list.push({ matchIndex, match: mapMatch(game, keyById, labels) });
    byRound.set(roundIndex, list);
  }

  const roundIndexes = [...byRound.keys()].sort((a, b) => a - b);
  if (roundIndexes.length === 0) {
    return null;
  }

  const rounds: BracketRound<BracketCompetitor>[] = roundIndexes.map((index) => ({
    id: `r${index}`,
    index,
    matches: (byRound.get(index) ?? []).sort((a, b) => a.matchIndex - b.matchIndex).map((entry) => entry.match),
  }));

  return {
    kind: 'single_elimination',
    size: (rounds[0]?.matches.length ?? 0) * 2,
    rounds,
    ...(thirdPlace ? { thirdPlace } : {}),
  };
};
