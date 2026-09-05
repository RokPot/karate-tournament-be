import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { isAdmin, isClubStaff, isJudge } from '~common/auth';
import { BeltLevel, Discipline, Gender, RegistrationStatus, TeamRole, TournamentStatus, UserRole } from '~common/enums';
import { formatDateOnlyAsDateTime, parseDateOfBirth } from '~common/utils/date-only.utils';

import { Category } from '../category/category.entity';
import { Club } from '../club/club.entity';
import { Tournament } from '../tournament/tournament.entity';
import { User } from '../user/user.entity';
import { UserService } from '../user/user.service';

import { BulkPublicRegistrationDto } from './dto/bulk-public-registration.dto';
import { BulkTeamDto } from './dto/bulk-team.dto';
import { CreateRegistrationWithUserDto } from './dto/create-registration-with-user.dto';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { PublicParticipantProfileDto } from './dto/public-participant-profile.dto';
import { Registration } from './registration.entity';
import { Team } from './team.entity';
import { userFitsCategory, validateUserFitsCategory } from './validators/category-eligibility.validator';

export interface FindOrCreateTempUserParams {
  email: string;
  firstName: string;
  lastName: string;
  weight?: number;
  dateOfBirth?: string;
  gender?: Gender;
  beltLevel?: BeltLevel;
  clubId?: string | null;
  rolesToAdd?: UserRole[];
}

export interface FindOrCreateBulkParticipantParams {
  firstName: string;
  lastName: string;
  clubName?: string;
  clubId: string | null;
  weight: number;
  dateOfBirth: string;
  gender?: Gender;
  beltLevel?: BeltLevel;
}

export interface CreateRegistrationForUserParams {
  tournamentId: string;
  categoryId: string;
  clubId: string | null;
  finalWeight?: number;
  teamId?: string | null;
  teamRole?: TeamRole | null;
  unapprovedAs?: 'not_found' | 'bad_request';
}

export interface BulkRegistrationResultItem {
  participantIndex: number;
  registrationIndex: number;
  teamIndex?: number;
  success: boolean;
  registration?: Registration;
  error?: string;
}

export interface BulkCreateWithCoachResult {
  coach: User;
  results: BulkRegistrationResultItem[];
}

export interface PublicParticipantSuitableCategoriesItem {
  firstName: string;
  lastName: string;
  weight: number;
  dateOfBirth: string;
  gender?: Gender | null;
  beltLevel?: BeltLevel | null;
  categories: Category[];
}

export interface SuitableParticipantItem {
  participantIndex: number;
  firstName: string;
  lastName: string;
  weight: number;
  dateOfBirth: string;
  gender?: Gender | null;
  beltLevel?: BeltLevel | null;
}

export interface CategorySuitableParticipantsItem {
  category: Category;
  participants: SuitableParticipantItem[];
}

/** Normalizes a string for use in synthetic participant placeholder emails. */
function slugifyForPlaceholder(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Stable synthetic email for bulk participants without a real address.
 * Same role as coach email: lookup key via auth0Id `temp-{email}`.
 * Identity: club + name + dateOfBirth.
 */
function buildParticipantPlaceholderEmail(params: FindOrCreateBulkParticipantParams): string {
  const clubKey = params.clubId ?? (params.clubName?.trim() ? slugifyForPlaceholder(params.clubName) : 'no-club');
  const parts = [
    clubKey,
    slugifyForPlaceholder(params.firstName),
    slugifyForPlaceholder(params.lastName),
    slugifyForPlaceholder(params.dateOfBirth),
  ];
  return `participant-${parts.join('.')}@bulk.participant.local`;
}

function getHttpExceptionMessage(error: unknown): string {
  if (error instanceof HttpException) {
    const response = error.getResponse();
    if (typeof response === 'string') {
      return response;
    }
    if (typeof response === 'object' && response !== null && 'message' in response) {
      const message = (response as { message: string | string[] }).message;
      return Array.isArray(message) ? message.join(', ') : message;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

/**
 * Registration Service
 * Handles registration-related business logic and database operations.
 */
@Injectable()
export class RegistrationService {
  private readonly logger = new Logger(RegistrationService.name);

  constructor(
    @InjectRepository(Registration)
    private readonly registrationRepository: Repository<Registration>,
    @InjectRepository(Tournament)
    private readonly tournamentRepository: Repository<Tournament>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Club)
    private readonly clubRepository: Repository<Club>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    private readonly userService: UserService,
  ) {}

  /**
   * Create a new registration
   */
  async create(data: CreateRegistrationDto, authenticatedUserId?: string): Promise<Registration> {
    const userId = data.userId || authenticatedUserId;
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return this.createRegistrationForUser(user, {
      tournamentId: data.tournamentId,
      categoryId: data.categoryId,
      clubId: data.clubId,
      finalWeight: data.finalWeight,
      unapprovedAs: 'bad_request',
    });
  }

  /**
   * Find or create a temp user by email (public registration flows).
   */
  async findOrCreateTempUserByEmail(params: FindOrCreateTempUserParams): Promise<User> {
    const tempAuth0Id = `temp-${params.email}`;
    let user = await this.userRepository.findOne({
      where: { auth0Id: tempAuth0Id },
    });

    const dateOfBirth = params.dateOfBirth != null ? parseDateOfBirth(params.dateOfBirth) : null;

    if (user) {
      user.email = params.email;
      user.firstName = params.firstName;
      user.lastName = params.lastName;
      if (params.weight !== undefined) user.weight = params.weight;
      if (params.gender !== undefined) user.gender = params.gender;
      if (params.beltLevel !== undefined) user.beltLevel = params.beltLevel;
      if (params.dateOfBirth != null) {
        user.dateOfBirth = dateOfBirth;
      }
      if (params.clubId !== undefined) user.clubId = params.clubId;
      if (params.rolesToAdd?.length) {
        const existingRoles = user.roles ?? [];
        user.roles = [...new Set([...existingRoles, ...params.rolesToAdd])];
      }
      user = await this.userRepository.save(user);
      this.logger.log(`Updated temp user: ${user.id} from email ${params.email}`);
      return user;
    }

    user = this.userRepository.create({
      auth0Id: tempAuth0Id,
      email: params.email,
      firstName: params.firstName,
      lastName: params.lastName,
      weight: params.weight ?? null,
      gender: params.gender ?? null,
      beltLevel: params.beltLevel ?? null,
      dateOfBirth,
      clubId: params.clubId ?? null,
      roles: params.rolesToAdd ?? [],
    });

    user = await this.userRepository.save(user);
    this.logger.log(`Created temp user: ${user.id} from email ${params.email}`);
    return user;
  }

  /**
   * Find or create a bulk participant without a real email.
   * Uses a deterministic placeholder email (auth0Id `temp-{placeholder}`) so repeat
   * bulk submissions update the same user instead of creating duplicates.
   */
  async findOrCreateBulkParticipant(params: FindOrCreateBulkParticipantParams): Promise<User> {
    const placeholderEmail = buildParticipantPlaceholderEmail(params);
    return this.findOrCreateTempUserByEmail({
      email: placeholderEmail,
      firstName: params.firstName,
      lastName: params.lastName,
      weight: params.weight,
      dateOfBirth: params.dateOfBirth,
      gender: params.gender,
      beltLevel: params.beltLevel,
      clubId: params.clubId,
    });
  }

  /**
   * Create a registration for an existing user with validation.
   */
  async createRegistrationForUser(user: User, data: CreateRegistrationForUserParams): Promise<Registration> {
    const tournament = await this.tournamentRepository.findOne({
      where: { id: data.tournamentId },
    });
    if (!tournament) {
      throw new NotFoundException(`Tournament with ID ${data.tournamentId} not found`);
    }
    this.assertTournamentApprovedForRegistration(tournament, data.unapprovedAs);

    const category = await this.categoryRepository.findOne({
      where: { id: data.categoryId },
    });
    if (!category) {
      throw new NotFoundException(`Category with ID ${data.categoryId} not found`);
    }

    if (data.clubId) {
      const club = await this.clubRepository.findOne({
        where: { id: data.clubId },
      });
      if (!club) {
        throw new NotFoundException(`Club with ID ${data.clubId} not found`);
      }
    }

    const effectiveWeight = data.finalWeight ?? user.weight;
    validateUserFitsCategory(user, category, effectiveWeight, tournament.startDate);

    const existing = await this.registrationRepository.findOne({
      where: {
        userId: user.id,
        tournamentId: data.tournamentId,
        categoryId: data.categoryId,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Registration already exists for user ${user.id} in tournament ${data.tournamentId} and category ${data.categoryId}`,
      );
    }

    const registration = this.registrationRepository.create({
      userId: user.id,
      tournamentId: data.tournamentId,
      categoryId: data.categoryId,
      clubId: data.clubId,
      status: RegistrationStatus.PENDING,
      finalWeight: data.finalWeight ?? null,
      teamId: data.teamId ?? null,
      teamRole: data.teamRole ?? null,
    });

    try {
      const saved = await this.registrationRepository.save(registration);
      this.logger.log(`Created registration: ${saved.id} for user ${user.id}`);
      return saved;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to create registration: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Create registration with user (public endpoint)
   * Creates or updates user from email/name, then creates registration
   */
  async createWithUser(data: CreateRegistrationWithUserDto): Promise<Registration> {
    const user = await this.findOrCreateTempUserByEmail({
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      weight: data.weight,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      beltLevel: data.beltLevel,
      clubId: data.clubId ?? null,
    });

    const clubId = data.clubId ?? user.clubId;
    if (!clubId) {
      throw new BadRequestException('Club ID is required for registration');
    }

    return this.createRegistrationForUser(user, {
      tournamentId: data.tournamentId,
      categoryId: data.categoryId,
      clubId,
      finalWeight: data.finalWeight,
      unapprovedAs: 'not_found',
    });
  }

  /**
   * Resolve a club by exact name (case-insensitive). Returns null if not found.
   */
  async resolveClubByName(clubName: string): Promise<Club | null> {
    const trimmed = clubName.trim();
    if (!trimmed) {
      return null;
    }

    return this.clubRepository
      .createQueryBuilder('club')
      .where('LOWER(club.name) = LOWER(:name)', { name: trimmed })
      .getOne();
  }

  /**
   * Bulk public registration: create coach and register multiple participants (partial success).
   */
  async bulkCreateWithCoach(data: BulkPublicRegistrationDto): Promise<BulkCreateWithCoachResult> {
    const tournament = await this.tournamentRepository.findOne({
      where: { id: data.tournamentId },
      relations: ['categoryAssignments', 'categoryAssignments.category'],
    });
    if (!tournament) {
      throw new NotFoundException(`Tournament with ID ${data.tournamentId} not found`);
    }
    this.assertTournamentApprovedForRegistration(tournament, 'not_found');

    const tournamentCategories = (tournament.categoryAssignments ?? []).map((assignment) => assignment.category);
    this.validateTeamsPayload(data, tournamentCategories, tournament.startDate);

    const club = data.clubName ? await this.resolveClubByName(data.clubName) : null;
    const resolvedClubId = club?.id ?? null;

    const coach = await this.findOrCreateTempUserByEmail({
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      clubId: resolvedClubId,
      rolesToAdd: [UserRole.CLUB_COACH],
    });

    const results: BulkRegistrationResultItem[] = [];
    const participantUsers: Array<User | null> = [];

    for (let participantIndex = 0; participantIndex < data.participants.length; participantIndex++) {
      const participant = data.participants[participantIndex];
      const registrations = participant.registrations ?? [];

      let user: User;
      try {
        user = await this.findOrCreateBulkParticipant({
          firstName: participant.firstName,
          lastName: participant.lastName,
          clubName: data.clubName,
          clubId: resolvedClubId,
          weight: participant.weight,
          dateOfBirth: participant.dateOfBirth,
          gender: participant.gender,
          beltLevel: participant.beltLevel,
        });
        participantUsers[participantIndex] = user;
      } catch (error) {
        participantUsers[participantIndex] = null;
        for (let registrationIndex = 0; registrationIndex < registrations.length; registrationIndex++) {
          results.push({
            participantIndex,
            registrationIndex,
            success: false,
            error: getHttpExceptionMessage(error),
          });
        }
        continue;
      }

      for (let registrationIndex = 0; registrationIndex < registrations.length; registrationIndex++) {
        const reg = registrations[registrationIndex];

        try {
          const saved = await this.createRegistrationForUser(user, {
            tournamentId: data.tournamentId,
            categoryId: reg.categoryId,
            clubId: resolvedClubId,
            finalWeight: reg.finalWeight,
            unapprovedAs: 'not_found',
          });
          results.push({
            participantIndex,
            registrationIndex,
            success: true,
            registration: saved,
          });
        } catch (error) {
          results.push({
            participantIndex,
            registrationIndex,
            success: false,
            error: getHttpExceptionMessage(error),
          });
        }
      }
    }

    if (data.teams?.length) {
      await this.assertTeamsUniqueAgainstStored(data.tournamentId, data.teams, participantUsers);
      const teamResults = await this.persistTeams(data.tournamentId, resolvedClubId, data.teams, participantUsers);
      results.push(...teamResults);
    }

    return { coach, results };
  }

  private validateTeamsPayload(
    data: BulkPublicRegistrationDto,
    tournamentCategories: Category[],
    tournamentStartDate: Date,
  ): void {
    const teams = data.teams ?? [];
    if (teams.length === 0) {
      return;
    }

    const participantCount = data.participants.length;
    const categoriesById = new Map(tournamentCategories.map((category) => [category.id, category]));
    const teamDisciplines = new Set<Discipline>([Discipline.KATA_TEAM, Discipline.KUMITE_TEAM]);
    const membersByCategory = new Map<string, Set<number>>();
    const rostersByCategory = new Map<string, Set<string>>();

    teams.forEach((team, teamIndex) => {
      const category = categoriesById.get(team.categoryId);
      if (!category) {
        throw new BadRequestException(`Team ${teamIndex}: category is not part of this tournament`);
      }
      if (!teamDisciplines.has(category.discipline) || category.teamSize == null) {
        throw new BadRequestException(`Team ${teamIndex}: category is not a team discipline with teamSize set`);
      }

      const starters = team.starters ?? [];
      const reserves = team.reserves ?? [];
      if (starters.length !== category.teamSize) {
        throw new BadRequestException(`Team ${teamIndex}: starters length must equal teamSize (${category.teamSize})`);
      }

      const maxReserves = category.teamReservesSize ?? 0;
      if (reserves.length > maxReserves) {
        throw new BadRequestException(`Team ${teamIndex}: reserves length must be between 0 and ${maxReserves}`);
      }

      const allIndexes = [...starters, ...reserves];
      const seenOnTeam = new Set<number>();
      for (const participantIndex of allIndexes) {
        if (!Number.isInteger(participantIndex) || participantIndex < 0 || participantIndex >= participantCount) {
          throw new BadRequestException(`Team ${teamIndex}: participantIndex ${participantIndex} is out of range`);
        }
        if (seenOnTeam.has(participantIndex)) {
          throw new BadRequestException(`Team ${teamIndex}: duplicate person on the same team`);
        }
        seenOnTeam.add(participantIndex);

        const categoryMembers = membersByCategory.get(team.categoryId) ?? new Set<number>();
        if (categoryMembers.has(participantIndex)) {
          throw new BadRequestException(
            `Team ${teamIndex}: participant ${participantIndex} is already on another team in this category`,
          );
        }
        categoryMembers.add(participantIndex);
        membersByCategory.set(team.categoryId, categoryMembers);

        const participant = data.participants[participantIndex];
        const syntheticUser = this.toSyntheticUser(participant);
        if (!userFitsCategory(syntheticUser, category, participant.weight, tournamentStartDate)) {
          throw new BadRequestException(
            `Team ${teamIndex}: participant ${participantIndex} is not eligible for this category`,
          );
        }
      }

      const rosterKey = [...allIndexes].sort((a, b) => a - b).join(',');
      const existingRosters = rostersByCategory.get(team.categoryId) ?? new Set<string>();
      if (existingRosters.has(rosterKey)) {
        throw new BadRequestException(`Team ${teamIndex}: duplicate roster in this category`);
      }
      existingRosters.add(rosterKey);
      rostersByCategory.set(team.categoryId, existingRosters);
    });
  }

  private async assertTeamsUniqueAgainstStored(
    tournamentId: string,
    teams: BulkTeamDto[],
    participantUsers: Array<User | null>,
  ): Promise<void> {
    const stored = await this.teamRepository.find({
      where: { tournamentId },
      relations: ['registrations'],
    });
    const storedRostersByCategory = new Map<string, Set<string>>();
    const storedMembersByCategory = new Map<string, Set<string>>();

    for (const team of stored) {
      const userIds = (team.registrations ?? []).map((registration) => registration.userId).sort();
      const rosterKey = userIds.join(',');
      const rosters = storedRostersByCategory.get(team.categoryId) ?? new Set<string>();
      rosters.add(rosterKey);
      storedRostersByCategory.set(team.categoryId, rosters);

      const members = storedMembersByCategory.get(team.categoryId) ?? new Set<string>();
      userIds.forEach((userId) => members.add(userId));
      storedMembersByCategory.set(team.categoryId, members);
    }

    teams.forEach((team, teamIndex) => {
      const memberUserIds: string[] = [];
      for (const participantIndex of [...team.starters, ...(team.reserves ?? [])]) {
        const user = participantUsers[participantIndex];
        if (!user) {
          throw new BadRequestException(`Team ${teamIndex}: participant ${participantIndex} could not be created`);
        }
        const members = storedMembersByCategory.get(team.categoryId) ?? new Set<string>();
        if (members.has(user.id)) {
          throw new BadRequestException(
            `Team ${teamIndex}: participant ${participantIndex} is already on a team in this category`,
          );
        }
        memberUserIds.push(user.id);
      }

      const rosterKey = [...memberUserIds].sort().join(',');
      const existingRosters = storedRostersByCategory.get(team.categoryId) ?? new Set<string>();
      if (existingRosters.has(rosterKey)) {
        throw new BadRequestException(`Team ${teamIndex}: duplicate roster in this category`);
      }
    });
  }

  private async persistTeams(
    tournamentId: string,
    clubId: string | null,
    teams: BulkTeamDto[],
    participantUsers: Array<User | null>,
  ): Promise<BulkRegistrationResultItem[]> {
    const results: BulkRegistrationResultItem[] = [];

    for (let teamIndex = 0; teamIndex < teams.length; teamIndex++) {
      const teamDto = teams[teamIndex];
      const team = await this.teamRepository.save(
        this.teamRepository.create({
          tournamentId,
          categoryId: teamDto.categoryId,
          clubId,
        }),
      );

      const members: Array<{ participantIndex: number; role: TeamRole }> = [
        ...teamDto.starters.map((participantIndex) => ({ participantIndex, role: TeamRole.STARTER })),
        ...(teamDto.reserves ?? []).map((participantIndex) => ({ participantIndex, role: TeamRole.RESERVE })),
      ];

      for (let registrationIndex = 0; registrationIndex < members.length; registrationIndex++) {
        const { participantIndex, role } = members[registrationIndex];
        const user = participantUsers[participantIndex];
        if (!user) {
          results.push({
            participantIndex,
            registrationIndex,
            teamIndex,
            success: false,
            error: `Participant ${participantIndex} could not be created`,
          });
          continue;
        }

        try {
          const saved = await this.createOrAttachTeamRegistration(user, {
            tournamentId,
            categoryId: teamDto.categoryId,
            clubId,
            teamId: team.id,
            teamRole: role,
            unapprovedAs: 'not_found',
          });
          results.push({
            participantIndex,
            registrationIndex,
            teamIndex,
            success: true,
            registration: saved,
          });
        } catch (error) {
          results.push({
            participantIndex,
            registrationIndex,
            teamIndex,
            success: false,
            error: getHttpExceptionMessage(error),
          });
        }
      }
    }

    return results;
  }

  private async createOrAttachTeamRegistration(
    user: User,
    data: CreateRegistrationForUserParams & { teamId: string; teamRole: TeamRole },
  ): Promise<Registration> {
    const existing = await this.registrationRepository.findOne({
      where: {
        userId: user.id,
        tournamentId: data.tournamentId,
        categoryId: data.categoryId,
      },
    });

    if (existing) {
      if (existing.teamId) {
        throw new BadRequestException('Participant is already on a team in this category');
      }
      existing.teamId = data.teamId;
      existing.teamRole = data.teamRole;
      return this.registrationRepository.save(existing);
    }

    return this.createRegistrationForUser(user, data);
  }

  /**
   * Get categories in a tournament that the user is eligible for (weight, age, belt).
   */
  async getSuitableCategoriesForUser(userId: string, tournamentId: string): Promise<Category[]> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const tournament = await this.tournamentRepository.findOne({
      where: { id: tournamentId },
      relations: ['categoryAssignments', 'categoryAssignments.category'],
      order: {
        categoryAssignments: {
          sortOrder: 'ASC',
        },
      },
    });
    if (!tournament) {
      throw new NotFoundException(`Tournament with ID ${tournamentId} not found`);
    }

    const categories = (tournament.categoryAssignments ?? []).map((assignment) => assignment.category);
    const effectiveWeight = user.weight;
    return categories.filter((category) => userFitsCategory(user, category, effectiveWeight, tournament.startDate));
  }

  private toSyntheticUser(
    profile: Pick<PublicParticipantProfileDto, 'weight' | 'dateOfBirth' | 'beltLevel' | 'gender'>,
  ): User {
    return {
      dateOfBirth: parseDateOfBirth(profile.dateOfBirth),
      weight: profile.weight,
      beltLevel: profile.beltLevel ?? null,
      gender: profile.gender ?? null,
    } as User;
  }

  private filterSuitableCategories(
    categories: Category[],
    profile: Pick<PublicParticipantProfileDto, 'weight' | 'dateOfBirth' | 'beltLevel' | 'gender'>,
    ageAtDateRef: Date,
  ): Category[] {
    const syntheticUser = this.toSyntheticUser(profile);
    return categories.filter((category) => userFitsCategory(syntheticUser, category, profile.weight, ageAtDateRef));
  }

  /**
   * Get suitable categories for weight, belt, and date of birth (public, no user account).
   */
  async getSuitableCategoriesForAttributes(
    tournamentId: string,
    weight: number,
    beltLevel: BeltLevel,
    dateOfBirth: string,
    gender?: Gender,
  ): Promise<Category[]> {
    const tournament = await this.tournamentRepository.findOne({
      where: { id: tournamentId },
      relations: ['categoryAssignments', 'categoryAssignments.category'],
      order: {
        categoryAssignments: {
          sortOrder: 'ASC',
        },
      },
    });
    if (!tournament) {
      throw new NotFoundException(`Tournament with ID ${tournamentId} not found`);
    }
    this.assertTournamentApprovedForRegistration(tournament, 'not_found');

    return this.filterSuitableCategories(
      (tournament.categoryAssignments ?? []).map((assignment) => assignment.category),
      { weight, dateOfBirth, beltLevel, gender },
      tournament.startDate,
    );
  }

  /**
   * Bulk suitable categories for multiple participants (public, no user accounts).
   */
  async getBulkSuitableCategoriesForAttributes(
    tournamentId: string,
    participants: PublicParticipantProfileDto[],
  ): Promise<PublicParticipantSuitableCategoriesItem[]> {
    const tournament = await this.tournamentRepository.findOne({
      where: { id: tournamentId },
      relations: ['categoryAssignments', 'categoryAssignments.category'],
      order: {
        categoryAssignments: {
          sortOrder: 'ASC',
        },
      },
    });
    if (!tournament) {
      throw new NotFoundException(`Tournament with ID ${tournamentId} not found`);
    }
    this.assertTournamentApprovedForRegistration(tournament, 'not_found');

    const categories = (tournament.categoryAssignments ?? []).map((assignment) => assignment.category);

    return participants.map((participant) => ({
      firstName: participant.firstName,
      lastName: participant.lastName,
      weight: participant.weight,
      dateOfBirth: formatDateOnlyAsDateTime(parseDateOfBirth(participant.dateOfBirth)),
      gender: participant.gender ?? null,
      beltLevel: participant.beltLevel ?? null,
      categories: this.filterSuitableCategories(categories, participant, tournament.startDate),
    }));
  }

  /**
   * Suitable participants grouped by category (public, inline profiles).
   */
  async getSuitableParticipantsByCategory(
    tournamentId: string,
    participants: PublicParticipantProfileDto[],
  ): Promise<CategorySuitableParticipantsItem[]> {
    const tournament = await this.tournamentRepository.findOne({
      where: { id: tournamentId },
      relations: ['categoryAssignments', 'categoryAssignments.category'],
      order: {
        categoryAssignments: {
          sortOrder: 'ASC',
        },
      },
    });
    if (!tournament) {
      throw new NotFoundException(`Tournament with ID ${tournamentId} not found`);
    }
    this.assertTournamentApprovedForRegistration(tournament, 'not_found');

    const categories = (tournament.categoryAssignments ?? []).map((assignment) => assignment.category);
    const ageAtDateRef = tournament.startDate;

    return categories.map((category) => ({
      category,
      participants: participants
        .map((participant, participantIndex) => ({ participant, participantIndex }))
        .filter(({ participant }) =>
          userFitsCategory(this.toSyntheticUser(participant), category, participant.weight, ageAtDateRef),
        )
        .map(({ participant, participantIndex }) => ({
          participantIndex,
          firstName: participant.firstName,
          lastName: participant.lastName,
          weight: participant.weight,
          dateOfBirth: formatDateOnlyAsDateTime(parseDateOfBirth(participant.dateOfBirth)),
          gender: participant.gender ?? null,
          beltLevel: participant.beltLevel ?? null,
        })),
    }));
  }

  /**
   * Find registration by ID
   */
  async findById(id: string): Promise<Registration | null> {
    return this.registrationRepository.findOne({
      where: { id },
      relations: ['user', 'tournament', 'category', 'club'],
    });
  }

  /**
   * Find all registrations for a tournament, optionally filtered by category.
   */
  async findByTournament(tournamentId: string, categoryId?: string, user?: User): Promise<Registration[]> {
    const tournament = await this.tournamentRepository.findOne({
      where: { id: tournamentId },
      relations: ['categoryAssignments', 'categoryAssignments.category'],
      order: {
        categoryAssignments: {
          sortOrder: 'ASC',
        },
      },
    });
    if (!tournament) {
      throw new NotFoundException(`Tournament with ID ${tournamentId} not found`);
    }

    if (user) {
      this.assertCanReadTournamentRegistrations(user, tournament);
    }

    if (categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: categoryId },
      });
      if (!category) {
        throw new NotFoundException(`Category with ID ${categoryId} not found`);
      }

      const tournamentCategoryIds = (tournament.categoryAssignments ?? []).map((assignment) => assignment.categoryId);
      if (!tournamentCategoryIds.includes(categoryId)) {
        throw new NotFoundException(`Category with ID ${categoryId} is not part of tournament ${tournamentId}`);
      }
    }

    return this.registrationRepository.find({
      where: {
        tournamentId,
        ...(categoryId ? { categoryId } : {}),
      },
      relations: ['user', 'tournament', 'category', 'club'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Find registrations for a user, optionally filtered by tournament and status
   */
  async findByUser(
    userId: string,
    filters?: { tournamentId?: string; status?: RegistrationStatus },
  ): Promise<Registration[]> {
    return this.registrationRepository.find({
      where: {
        userId,
        ...(filters?.tournamentId ? { tournamentId: filters.tournamentId } : {}),
        ...(filters?.status ? { status: filters.status } : {}),
      },
      relations: ['user', 'tournament', 'category', 'club'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Update registration status
   */
  async updateStatus(id: string, status: RegistrationStatus): Promise<Registration> {
    const registration = await this.findById(id);
    if (!registration) {
      throw new NotFoundException(`Registration with ID ${id} not found`);
    }

    registration.status = status;
    return this.registrationRepository.save(registration);
  }

  /**
   * Registration counts for every assigned tournament category, including zeros.
   */
  async findCountsByTournament(
    tournamentId: string,
    user: User,
  ): Promise<Array<{ categoryId: string; registrationCount: number }>> {
    const tournament = await this.tournamentRepository.findOne({
      where: { id: tournamentId },
      relations: ['categoryAssignments'],
      order: {
        categoryAssignments: {
          sortOrder: 'ASC',
        },
      },
    });
    if (!tournament) {
      throw new NotFoundException(`Tournament with ID ${tournamentId} not found`);
    }

    this.assertCanReadTournamentRegistrations(user, tournament);

    const assignments = tournament.categoryAssignments ?? [];
    if (assignments.length === 0) {
      return [];
    }

    const rawCounts = await this.registrationRepository
      .createQueryBuilder('registration')
      .select('registration.categoryId', 'categoryId')
      .addSelect('COUNT(*)', 'count')
      .where('registration.tournamentId = :tournamentId', { tournamentId })
      .groupBy('registration.categoryId')
      .getRawMany<{ categoryId: string; count: string }>();

    const countByCategoryId = new Map(rawCounts.map((row) => [row.categoryId, Number(row.count)]));

    return assignments.map((assignment) => ({
      categoryId: assignment.categoryId,
      registrationCount: countByCategoryId.get(assignment.categoryId) ?? 0,
    }));
  }

  private assertCanReadTournamentRegistrations(user: User, tournament: Tournament): void {
    const canRead =
      isAdmin(user.roles) ||
      isJudge(user.roles) ||
      (isClubStaff(user.roles) && !!user.clubId && tournament.clubId === user.clubId);
    if (!canRead) {
      throw new ForbiddenException('Insufficient permissions to list registrations for this tournament');
    }
  }

  private assertTournamentApprovedForRegistration(
    tournament: Tournament,
    unapprovedAs: 'not_found' | 'bad_request' = 'bad_request',
  ): void {
    if (tournament.status === TournamentStatus.APPROVED) {
      return;
    }
    if (unapprovedAs === 'not_found') {
      throw new NotFoundException(`Tournament with ID ${tournament.id} not found`);
    }
    throw new BadRequestException('Registration is not open');
  }
}
