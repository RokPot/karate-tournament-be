import type { Bracket, BracketMatch, BracketSlot } from '~common/brackets/core';
import { CompetitorKind, GameSlotKind, GameSlotOutcome, GameWinnerSide, isTeamDiscipline } from '~common/enums';

export type ScheduleParticipant = { id: string };

export type MappedSlot = {
  kind: GameSlotKind;
  competitorId: string | null;
  fromKey: string | null;
  outcome: GameSlotOutcome | null;
};

export type MappedGame = {
  key: string;
  isThirdPlace: boolean;
  isBye: boolean;
  winnerSide: GameWinnerSide | null;
  slotA: MappedSlot;
  slotB: MappedSlot;
};

const mapSlot = (slot: BracketSlot<ScheduleParticipant>): MappedSlot => {
  if (slot.kind === 'item') {
    return { kind: GameSlotKind.ITEM, competitorId: slot.item.id, fromKey: null, outcome: null };
  }
  if (slot.kind === 'bye') {
    return { kind: GameSlotKind.BYE, competitorId: null, fromKey: null, outcome: null };
  }
  return {
    kind: GameSlotKind.TBD,
    competitorId: null,
    fromKey: slot.fromMatchId,
    outcome: slot.outcome === 'loser' ? GameSlotOutcome.LOSER : GameSlotOutcome.WINNER,
  };
};

const mapWinnerSide = (winner: BracketMatch<ScheduleParticipant>['data']['winner']): GameWinnerSide | null => {
  if (winner === 'item') {
    return GameWinnerSide.ITEM;
  }
  if (winner === 'item2') {
    return GameWinnerSide.ITEM2;
  }
  return null;
};

const mapGeneratedMatch = (match: BracketMatch<ScheduleParticipant>, isThirdPlace: boolean): MappedGame => ({
  key: match.id,
  isThirdPlace,
  isBye: match.data.isBye,
  winnerSide: mapWinnerSide(match.data.winner),
  slotA: mapSlot(match.item),
  slotB: mapSlot(match.item2),
});

export const mapGeneratedBracketToGames = (bracket: Bracket<ScheduleParticipant>): MappedGame[] => {
  const games = bracket.rounds.flatMap((round) => round.matches.map((match) => mapGeneratedMatch(match, false)));
  if (bracket.thirdPlace) {
    games.push(mapGeneratedMatch(bracket.thirdPlace, true));
  }
  return games;
};

export { isTeamDiscipline };

export const competitorKindForDiscipline = (discipline: string): CompetitorKind =>
  isTeamDiscipline(discipline) ? CompetitorKind.TEAM : CompetitorKind.REGISTRATION;
