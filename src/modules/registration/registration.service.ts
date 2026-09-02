import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BeltLevel, Gender, RegistrationStatus, UserRole } from '~common/enums';
import { formatDateOnlyAsDateTime, parseDateOfBirth } from '~common/utils/date-only.utils';

import { Category } from '../category/category.entity';
import { Club } from '../club/club.entity';
import { Tournament } from '../tournament/tournament.entity';
import { User } from '../user/user.entity';
import { UserService } from '../user/user.service';

import { BulkPublicRegistrationDto } from './dto/bulk-public-registration.dto';
import { CreateRegistrationWithUserDto } from './dto/create-registration-with-user.dto';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { PublicParticipantProfileDto } from './dto/public-participant-profile.dto';
import { Registration } from './registration.entity';
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
}

export interface BulkRegistrationResultItem {
  participantIndex: number;
  registrationIndex: number;
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
    });
    if (!tournament) {
      throw new NotFoundException(`Tournament with ID ${data.tournamentId} not found`);
    }

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

    for (let participantIndex = 0; participantIndex < data.participants.length; participantIndex++) {
      const participant = data.participants[participantIndex];

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
      } catch (error) {
        for (let registrationIndex = 0; registrationIndex < participant.registrations.length; registrationIndex++) {
          results.push({
            participantIndex,
            registrationIndex,
            success: false,
            error: getHttpExceptionMessage(error),
          });
        }
        continue;
      }

      for (let registrationIndex = 0; registrationIndex < participant.registrations.length; registrationIndex++) {
        const reg = participant.registrations[registrationIndex];

        try {
          const saved = await this.createRegistrationForUser(user, {
            tournamentId: data.tournamentId,
            categoryId: reg.categoryId,
            clubId: resolvedClubId,
            finalWeight: reg.finalWeight,
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

    return { coach, results };
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
  async findByTournament(tournamentId: string, categoryId?: string): Promise<Registration[]> {
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
   * Find all registrations for a user
   */
  async findByUser(userId: string): Promise<Registration[]> {
    return this.registrationRepository.find({
      where: { userId },
      relations: ['tournament', 'category', 'club'],
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
}
