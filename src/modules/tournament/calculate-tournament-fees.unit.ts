import { describe, expect, it } from 'vitest';

import { Discipline } from '~common/enums';

import {
  amountForIndividualCategoryCount,
  calculateTournamentFees,
  centsToEuros,
  eurosToCents,
  type FeeCalculationRegistration,
  type FeeCalculationTeam,
  type TournamentFeeSchedule,
} from './calculate-tournament-fees';

const fees: TournamentFeeSchedule = {
  oneCategory: 10,
  twoCategories: 20,
  threeOrMoreCategories: 30,
  team: 30,
};

const individual = (
  userId: string,
  overrides: Partial<FeeCalculationRegistration> = {},
): FeeCalculationRegistration => ({
  userId,
  firstName: 'Ada',
  lastName: 'Lee',
  clubId: 'club-1',
  discipline: Discipline.KATA,
  categoryId: 'cat-individual',
  categoryName: 'Kata',
  teamId: null,
  teamMemberTeamIds: [],
  ...overrides,
});

const teamRegistration = (
  userId: string,
  teamId: string,
  overrides: Partial<FeeCalculationRegistration> = {},
): FeeCalculationRegistration => ({
  userId,
  firstName: 'Team',
  lastName: 'Member',
  clubId: 'club-1',
  discipline: Discipline.KATA_TEAM,
  categoryId: `cat-${teamId}`,
  categoryName: 'Kata Team',
  teamId,
  teamMemberTeamIds: [teamId],
  ...overrides,
});

const team = (id: string, overrides: Partial<FeeCalculationTeam> = {}): FeeCalculationTeam => ({
  id,
  categoryId: `cat-${id}`,
  categoryName: 'Kata Team',
  clubId: 'club-1',
  ...overrides,
});

describe('amountForIndividualCategoryCount', () => {
  it('returns 0 for no categories', () => {
    expect(amountForIndividualCategoryCount(0, fees)).toBe(0);
  });

  it('uses the matching band, and 3 or more stays at the third amount', () => {
    expect(amountForIndividualCategoryCount(1, fees)).toBe(10);
    expect(amountForIndividualCategoryCount(2, fees)).toBe(20);
    expect(amountForIndividualCategoryCount(3, fees)).toBe(30);
    expect(amountForIndividualCategoryCount(5, fees)).toBe(30);
  });
});

describe('calculateTournamentFees', () => {
  it('returns empty lists and total 0 when there are no billed registrations', () => {
    const result = calculateTournamentFees({ fees, registrations: [], teams: [team('team-1')] });

    expect(result.participants).toEqual([]);
    expect(result.teams).toEqual([]);
    expect(result.clubs).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.fees).toEqual(fees);
  });

  it('charges the 1-category fee for a single individual registration', () => {
    const result = calculateTournamentFees({
      fees,
      registrations: [individual('user-1')],
      teams: [],
    });

    expect(result.participants).toEqual([
      { userId: 'user-1', name: 'Ada Lee', clubId: 'club-1', categoryCount: 1, amount: 10 },
    ]);
    expect(result.teams).toEqual([]);
    expect(result.clubs).toEqual([{ clubId: 'club-1', participantTotal: 10, teamTotal: 0, total: 10 }]);
    expect(result.total).toBe(10);
  });

  it('charges the 2-category fee and the 3-or-more fee as a total for that band', () => {
    const two = calculateTournamentFees({
      fees,
      registrations: [individual('user-1'), individual('user-1', { discipline: Discipline.YIJU_KUMITE })],
      teams: [],
    });
    expect(two.participants[0]).toMatchObject({ categoryCount: 2, amount: 20 });
    expect(two.total).toBe(20);

    const threeOrMore = calculateTournamentFees({
      fees,
      registrations: [
        individual('user-1'),
        individual('user-1', { discipline: Discipline.YIJU_KUMITE, categoryId: 'cat-2' }),
        individual('user-1', { discipline: Discipline.KATA, categoryId: 'cat-3' }),
        individual('user-1', { discipline: Discipline.YIJU_KUMITE, categoryId: 'cat-4' }),
      ],
      teams: [],
    });
    expect(threeOrMore.participants[0]).toMatchObject({ categoryCount: 4, amount: 30 });
    expect(threeOrMore.total).toBe(30);
  });

  it('does not count team categories toward the individual 1/2/3+ total', () => {
    const result = calculateTournamentFees({
      fees,
      registrations: [
        individual('user-1'),
        teamRegistration('user-1', 'team-1'),
        teamRegistration('user-1', 'team-1', { discipline: Discipline.KUMITE_TEAM }),
        teamRegistration('user-1', 'team-yako', {
          discipline: Discipline.YAKO_SOKU_KUMITE,
          categoryName: 'Yako-Soku Kumite',
        }),
      ],
      teams: [team('team-1'), team('team-yako', { categoryName: 'Yako-Soku Kumite' })],
    });

    expect(result.participants).toEqual([
      { userId: 'user-1', name: 'Ada Lee', clubId: 'club-1', categoryCount: 1, amount: 10 },
    ]);
    expect(result.teams).toEqual([
      {
        teamId: 'team-1',
        categoryId: 'cat-team-1',
        categoryName: 'Kata Team',
        name: 'Kata Team',
        clubId: 'club-1',
        amount: 30,
      },
      {
        teamId: 'team-yako',
        categoryId: 'cat-team-yako',
        categoryName: 'Yako-Soku Kumite',
        name: 'Yako-Soku Kumite',
        clubId: 'club-1',
        amount: 30,
      },
    ]);
    expect(result.total).toBe(70);
  });

  it('uses the stored team name on the fee line when provided', () => {
    const result = calculateTournamentFees({
      fees,
      registrations: [teamRegistration('user-1', 'team-1')],
      teams: [team('team-1', { name: 'SKIF Ljubljana A' })],
    });

    expect(result.teams[0]).toMatchObject({
      teamId: 'team-1',
      name: 'SKIF Ljubljana A',
      categoryName: 'Kata Team',
    });
  });

  it('charges each qualifying team once even when several members are billed', () => {
    const result = calculateTournamentFees({
      fees,
      registrations: [teamRegistration('user-1', 'team-1'), teamRegistration('user-2', 'team-1')],
      teams: [team('team-1')],
    });

    expect(result.participants).toEqual([]);
    expect(result.teams).toHaveLength(1);
    expect(result.teams[0].amount).toBe(30);
    expect(result.total).toBe(30);
  });

  it('synthesizes a team line from the registration when the team list is omitted', () => {
    const result = calculateTournamentFees({
      fees,
      registrations: [teamRegistration('user-1', 'team-1')],
    });

    expect(result.teams).toEqual([
      {
        teamId: 'team-1',
        categoryId: 'cat-team-1',
        categoryName: 'Kata Team',
        name: 'Kata Team',
        clubId: 'club-1',
        amount: 30,
      },
    ]);
    expect(result.total).toBe(30);
  });

  it('does not bill a team registration with no team id', () => {
    const result = calculateTournamentFees({
      fees,
      registrations: [teamRegistration('user-1', 'team-1', { teamId: null, teamMemberTeamIds: [] })],
    });

    expect(result.teams).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('rolls up participant and team amounts by club, keeping a null club as its own row', () => {
    const result = calculateTournamentFees({
      fees,
      registrations: [
        individual('user-1', { clubId: 'club-a' }),
        individual('user-2', { firstName: 'No', lastName: 'Club', clubId: null }),
        teamRegistration('user-3', 'team-1', { clubId: 'club-a' }),
      ],
      teams: [team('team-1', { clubId: 'club-a' })],
    });

    expect(result.clubs).toEqual([
      { clubId: 'club-a', participantTotal: 10, teamTotal: 30, total: 40 },
      { clubId: null, participantTotal: 10, teamTotal: 0, total: 10 },
    ]);
    expect(result.total).toBe(50);
  });

  it('sums in cents so euro totals do not drift', () => {
    const fractional: TournamentFeeSchedule = {
      oneCategory: 10.1,
      twoCategories: 20.2,
      threeOrMoreCategories: 30.3,
      team: 10.15,
    };

    expect(eurosToCents(10.1) + eurosToCents(20.2)).toBe(3030);
    expect(centsToEuros(3030)).toBe(30.3);

    const result = calculateTournamentFees({
      fees: fractional,
      registrations: [
        individual('user-1'),
        individual('user-2'),
        individual('user-2', { discipline: Discipline.YIJU_KUMITE }),
        teamRegistration('user-3', 'team-1'),
        teamRegistration('user-4', 'team-2'),
      ],
      teams: [team('team-1'), team('team-2')],
    });

    expect(result.participants.find((row) => row.userId === 'user-1')?.amount).toBe(10.1);
    expect(result.participants.find((row) => row.userId === 'user-2')?.amount).toBe(20.2);
    expect(result.teams).toHaveLength(2);
    expect(result.total).toBe(50.6);
  });
});
