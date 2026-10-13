import { isTeamDiscipline, RegistrationStatus } from '~common/enums';

export const BILLED_REGISTRATION_STATUSES = [RegistrationStatus.PENDING, RegistrationStatus.APPROVED] as const;

export type TournamentFeeSchedule = {
  oneCategory: number;
  twoCategories: number;
  threeOrMoreCategories: number;
  team: number;
};

export type FeeCalculationRegistration = {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  clubId: string | null;
  discipline: string;
  categoryId: string;
  categoryName: string;
  teamId: string | null;
  teamMemberTeamIds: string[];
};

export type FeeCalculationTeam = {
  id: string;
  categoryId: string;
  categoryName: string;
  clubId: string | null;
};

export type TournamentFeeParticipant = {
  userId: string;
  name: string;
  clubId: string | null;
  categoryCount: number;
  amount: number;
};

export type TournamentFeeTeamLine = {
  teamId: string;
  categoryId: string;
  categoryName: string;
  clubId: string | null;
  amount: number;
};

export type TournamentFeeClubLine = {
  clubId: string | null;
  participantTotal: number;
  teamTotal: number;
  total: number;
};

export type TournamentFeeCalculation = {
  fees: TournamentFeeSchedule;
  participants: TournamentFeeParticipant[];
  teams: TournamentFeeTeamLine[];
  clubs: TournamentFeeClubLine[];
  total: number;
};

export const eurosToCents = (euros: number): number => Math.round(euros * 100);

export const centsToEuros = (cents: number): number => Number((cents / 100).toFixed(2));

export { isTeamDiscipline };

export const amountForIndividualCategoryCount = (count: number, fees: TournamentFeeSchedule): number => {
  if (count <= 0) {
    return 0;
  }
  if (count === 1) {
    return fees.oneCategory;
  }
  if (count === 2) {
    return fees.twoCategories;
  }
  return fees.threeOrMoreCategories;
};

const displayName = (firstName: string | null, lastName: string | null): string =>
  [firstName, lastName].filter((part): part is string => !!part && part.trim() !== '').join(' ');

export const teamIdsForRegistration = (registration: {
  teamId: string | null;
  teamMemberTeamIds?: string[];
  teamMembers?: Array<{ teamId: string }>;
}): string[] => {
  const ids = [
    ...(registration.teamMemberTeamIds ?? []),
    ...(registration.teamMembers ?? []).map((member) => member.teamId),
  ];
  if (registration.teamId) {
    ids.push(registration.teamId);
  }
  return ids;
};

export const scheduleFromTournament = (tournament: {
  feeOneCategory: number;
  feeTwoCategories: number;
  feeThreeOrMoreCategories: number;
  feeTeam: number;
}): TournamentFeeSchedule => ({
  oneCategory: tournament.feeOneCategory,
  twoCategories: tournament.feeTwoCategories,
  threeOrMoreCategories: tournament.feeThreeOrMoreCategories,
  team: tournament.feeTeam,
});

export const mapRegistrationToFeeInput = (registration: {
  userId: string;
  clubId: string | null;
  teamId: string | null;
  user?: { firstName: string | null; lastName: string | null } | null;
  category: { id?: string; discipline: string; name: string };
  categoryId: string;
  teamMembers?: Array<{ teamId: string }>;
}): FeeCalculationRegistration => ({
  userId: registration.userId,
  firstName: registration.user?.firstName ?? null,
  lastName: registration.user?.lastName ?? null,
  clubId: registration.clubId,
  discipline: registration.category.discipline,
  categoryId: registration.categoryId,
  categoryName: registration.category.name,
  teamId: registration.teamId,
  teamMemberTeamIds: (registration.teamMembers ?? []).map((member) => member.teamId),
});

type CalculateTournamentFeesInput = {
  fees: TournamentFeeSchedule;
  registrations: FeeCalculationRegistration[];
  teams?: FeeCalculationTeam[];
};

/**
 * Calculates amounts due from billed registrations. Callers pass only pending/approved rows.
 * Team categories are excluded from the 1/2/3+ count. Each team is charged once.
 */
export const calculateTournamentFees = (input: CalculateTournamentFeesInput): TournamentFeeCalculation => {
  const teamById = new Map((input.teams ?? []).map((team) => [team.id, team]));
  const participantsByUserId = new Map<
    string,
    { userId: string; name: string; clubId: string | null; categoryCount: number }
  >();
  const billedTeamIds = new Set<string>();

  for (const registration of input.registrations) {
    if (isTeamDiscipline(registration.discipline)) {
      for (const teamId of teamIdsForRegistration(registration)) {
        billedTeamIds.add(teamId);
        if (!teamById.has(teamId)) {
          teamById.set(teamId, {
            id: teamId,
            categoryId: registration.categoryId,
            categoryName: registration.categoryName,
            clubId: registration.clubId,
          });
        }
      }
      continue;
    }

    const existing = participantsByUserId.get(registration.userId);
    if (existing) {
      existing.categoryCount += 1;
      continue;
    }

    participantsByUserId.set(registration.userId, {
      userId: registration.userId,
      name: displayName(registration.firstName, registration.lastName),
      clubId: registration.clubId,
      categoryCount: 1,
    });
  }

  const participants: TournamentFeeParticipant[] = [...participantsByUserId.values()]
    .map((participant) => ({
      ...participant,
      amount: amountForIndividualCategoryCount(participant.categoryCount, input.fees),
    }))
    .sort((a, b) => a.name.localeCompare(b.name) || a.userId.localeCompare(b.userId));

  const teams: TournamentFeeTeamLine[] = [...billedTeamIds]
    .map((teamId) => teamById.get(teamId))
    .filter((team): team is FeeCalculationTeam => !!team)
    .map((team) => ({
      teamId: team.id,
      categoryId: team.categoryId,
      categoryName: team.categoryName,
      clubId: team.clubId,
      amount: input.fees.team,
    }))
    .sort((a, b) => a.categoryName.localeCompare(b.categoryName) || a.teamId.localeCompare(b.teamId));

  const clubsById = new Map<string | null, { participantCents: number; teamCents: number }>();
  const addClubCents = (clubId: string | null, participantCents: number, teamCents: number): void => {
    const existing = clubsById.get(clubId) ?? { participantCents: 0, teamCents: 0 };
    existing.participantCents += participantCents;
    existing.teamCents += teamCents;
    clubsById.set(clubId, existing);
  };

  for (const participant of participants) {
    addClubCents(participant.clubId, eurosToCents(participant.amount), 0);
  }
  for (const team of teams) {
    addClubCents(team.clubId, 0, eurosToCents(team.amount));
  }

  const clubs: TournamentFeeClubLine[] = [...clubsById.entries()]
    .map(([clubId, totals]) => ({
      clubId,
      participantTotal: centsToEuros(totals.participantCents),
      teamTotal: centsToEuros(totals.teamCents),
      total: centsToEuros(totals.participantCents + totals.teamCents),
    }))
    .sort((a, b) => {
      if (a.clubId == null) {
        return 1;
      }
      if (b.clubId == null) {
        return -1;
      }
      return a.clubId.localeCompare(b.clubId);
    });

  const totalCents =
    participants.reduce((sum, participant) => sum + eurosToCents(participant.amount), 0) +
    teams.reduce((sum, team) => sum + eurosToCents(team.amount), 0);

  return {
    fees: input.fees,
    participants,
    teams,
    clubs,
    total: centsToEuros(totalCents),
  };
};
