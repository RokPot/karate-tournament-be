import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, Repository } from 'typeorm';

import { hasRole, isAdmin, isClubStaff, isJudge } from '~common/auth';
import { TournamentStatus, UserRole } from '~common/enums';

import { Category } from '../category/category.entity';
import { Club } from '../club/club.entity';
import { User } from '../user/user.entity';

import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { TournamentCategory } from './tournament-category.entity';
import { Tournament } from './tournament.entity';

export const PUBLIC_TOURNAMENT_STATUSES = [
  TournamentStatus.APPROVED,
  TournamentStatus.IN_PROGRESS,
  TournamentStatus.ENDED,
] as const;

export function isPublicTournamentStatus(status: TournamentStatus): boolean {
  return (PUBLIC_TOURNAMENT_STATUSES as readonly TournamentStatus[]).includes(status);
}

/**
 * Tournament Service
 * Handles tournament-related business logic and database operations.
 */
@Injectable()
export class TournamentService {
  private readonly logger = new Logger(TournamentService.name);

  constructor(
    @InjectRepository(Tournament)
    private readonly tournamentRepository: Repository<Tournament>,
    @InjectRepository(TournamentCategory)
    private readonly tournamentCategoryRepository: Repository<TournamentCategory>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Club)
    private readonly clubRepository: Repository<Club>,
  ) {}

  /**
   * Create a new tournament
   */
  async create(data: CreateTournamentDto, createdByUserId: string, status: TournamentStatus): Promise<Tournament> {
    // Convert string dates to Date objects
    const startDate = new Date(data.startDate);
    const registrationDeadline = new Date(data.registrationDeadline);

    if (data.clubId) {
      const club = await this.clubRepository.findOne({ where: { id: data.clubId } });
      if (!club) {
        throw new NotFoundException(`Club with ID ${data.clubId} not found`);
      }
    }

    const tournament = this.tournamentRepository.create({
      name: data.name,
      location: data.location,
      startDate,
      registrationDeadline,
      createdBy: createdByUserId,
      clubId: data.clubId ?? null,
      status,
      reviewedAt: null,
      reviewedBy: null,
      reviewNote: null,
      startedAt: null,
      startedBy: null,
      endedAt: null,
      endedBy: null,
    });

    try {
      const saved = await this.tournamentRepository.save(tournament);
      this.logger.log(`Created tournament: ${saved.id} by user ${createdByUserId}`);
      return saved;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to create tournament: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Find all tournaments
   */
  async findAll(): Promise<Tournament[]> {
    return this.findMany({});
  }

  /**
   * Tournaments visible to the caller, optionally filtered by review or lifecycle status.
   */
  async findVisibleToUser(user: User, status?: TournamentStatus): Promise<Tournament[]> {
    if (isAdmin(user.roles)) {
      return this.findMany(status ? { status } : {});
    }

    if (isClubStaff(user.roles)) {
      if (status && isPublicTournamentStatus(status)) {
        return this.findMany({ status });
      }

      if (status === TournamentStatus.PENDING || status === TournamentStatus.DECLINED) {
        if (!user.clubId) {
          return [];
        }
        return this.findMany({ status, clubId: user.clubId });
      }

      if (!user.clubId) {
        return this.findMany({ status: In([...PUBLIC_TOURNAMENT_STATUSES]) });
      }

      return this.findMany([
        { status: In([...PUBLIC_TOURNAMENT_STATUSES]) },
        { clubId: user.clubId, status: In([TournamentStatus.PENDING, TournamentStatus.DECLINED]) },
      ]);
    }

    if (isJudge(user.roles) || hasRole(user.roles, UserRole.FREE_MEMBER) || hasRole(user.roles, UserRole.CLUB_MEMBER)) {
      if (status === TournamentStatus.PENDING || status === TournamentStatus.DECLINED) {
        return [];
      }
      if (status && isPublicTournamentStatus(status)) {
        return this.findMany({ status });
      }
      return this.findMany({ status: In([...PUBLIC_TOURNAMENT_STATUSES]) });
    }

    throw new ForbiddenException('Insufficient permissions to list all tournaments');
  }

  /**
   * Distinct tournaments the user has at least one registration for (any status)
   */
  async findRegisteredForUser(userId: string): Promise<Tournament[]> {
    const rows = await this.tournamentRepository
      .createQueryBuilder('tournament')
      .innerJoin('tournament.registrations', 'registration')
      .where('registration.userId = :userId', { userId })
      .andWhere('tournament.status IN (:...statuses)', { statuses: [...PUBLIC_TOURNAMENT_STATUSES] })
      .select('tournament.id', 'id')
      .distinct(true)
      .getRawMany<{ id: string }>();

    const ids = rows.map((row) => row.id);
    if (ids.length === 0) {
      return [];
    }

    return this.tournamentRepository.find({
      where: { id: In(ids) },
      relations: ['createdByUser', 'categoryAssignments', 'categoryAssignments.category', 'club'],
      order: {
        startDate: 'DESC',
        createdAt: 'DESC',
        categoryAssignments: {
          sortOrder: 'ASC',
        },
      },
    });
  }

  /**
   * Find a tournament by ID
   */
  async findById(id: string): Promise<Tournament | null> {
    return this.tournamentRepository.findOne({
      where: { id },
      relations: ['createdByUser', 'categoryAssignments', 'categoryAssignments.category', 'club'],
      order: {
        categoryAssignments: {
          sortOrder: 'ASC',
        },
      },
    });
  }

  /**
   * Find a tournament by ID or throw if not found
   */
  async findByIdOrFail(id: string): Promise<Tournament> {
    const tournament = await this.findById(id);
    if (!tournament) {
      throw new NotFoundException(`Tournament with ID ${id} not found`);
    }
    return tournament;
  }

  /**
   * Update a tournament
   */
  async update(id: string, data: UpdateTournamentDto): Promise<Tournament> {
    const tournament = await this.findByIdOrFail(id);

    // Convert string dates to Date objects if provided (not null/undefined/empty)
    if (data.startDate !== undefined && data.startDate !== null && data.startDate !== '') {
      tournament.startDate = new Date(data.startDate);
    }
    if (
      data.registrationDeadline !== undefined &&
      data.registrationDeadline !== null &&
      data.registrationDeadline !== ''
    ) {
      tournament.registrationDeadline = new Date(data.registrationDeadline);
    }
    if (data.name !== undefined) tournament.name = data.name;
    if (data.location !== undefined) tournament.location = data.location;

    if (data.clubId !== undefined) {
      if (data.clubId != null && data.clubId !== '') {
        const club = await this.clubRepository.findOne({ where: { id: data.clubId } });
        if (!club) {
          throw new NotFoundException(`Club with ID ${data.clubId} not found`);
        }
      }
      tournament.clubId = data.clubId ?? null;
    }

    return this.tournamentRepository.save(tournament);
  }

  /**
   * Approve a pending or declined tournament.
   */
  async approve(id: string, reviewedBy: string): Promise<Tournament> {
    const tournament = await this.findByIdOrFail(id);
    if (tournament.status !== TournamentStatus.PENDING && tournament.status !== TournamentStatus.DECLINED) {
      throw new BadRequestException('Only pending or declined tournaments can be approved');
    }

    tournament.status = TournamentStatus.APPROVED;
    tournament.reviewedAt = new Date();
    tournament.reviewedBy = reviewedBy;
    tournament.reviewNote = null;
    await this.tournamentRepository.save(tournament);
    this.logger.log(`Approved tournament: ${id} by user ${reviewedBy}`);
    return this.findByIdOrFail(id);
  }

  /**
   * Decline a pending tournament.
   */
  async decline(id: string, reviewedBy: string, reason?: string): Promise<Tournament> {
    const tournament = await this.findByIdOrFail(id);
    if (tournament.status !== TournamentStatus.PENDING) {
      throw new BadRequestException('Only pending tournaments can be declined');
    }

    tournament.status = TournamentStatus.DECLINED;
    tournament.reviewedAt = new Date();
    tournament.reviewedBy = reviewedBy;
    tournament.reviewNote = reason?.trim() ? reason.trim() : null;
    await this.tournamentRepository.save(tournament);
    this.logger.log(`Declined tournament: ${id} by user ${reviewedBy}`);
    return this.findByIdOrFail(id);
  }

  /**
   * Resubmit a declined tournament for review.
   */
  async resubmit(id: string, note?: string): Promise<Tournament> {
    const tournament = await this.findByIdOrFail(id);
    if (tournament.status !== TournamentStatus.DECLINED) {
      throw new BadRequestException('Only declined tournaments can be resubmitted');
    }

    tournament.status = TournamentStatus.PENDING;
    tournament.reviewedAt = null;
    tournament.reviewedBy = null;
    tournament.reviewNote = note?.trim() ? note.trim() : null;
    await this.tournamentRepository.save(tournament);
    this.logger.log(`Resubmitted tournament: ${id}`);
    return this.findByIdOrFail(id);
  }

  /**
   * Mark an approved tournament as in progress.
   */
  async start(id: string, startedBy: string): Promise<Tournament> {
    const tournament = await this.findByIdOrFail(id);
    if (tournament.status !== TournamentStatus.APPROVED) {
      throw new BadRequestException('Only approved tournaments can be started');
    }

    tournament.status = TournamentStatus.IN_PROGRESS;
    tournament.startedAt = new Date();
    tournament.startedBy = startedBy;
    tournament.endedAt = null;
    tournament.endedBy = null;
    await this.tournamentRepository.save(tournament);
    this.logger.log(`Started tournament: ${id} by user ${startedBy}`);
    return this.findByIdOrFail(id);
  }

  /**
   * Mark an in-progress tournament as ended.
   */
  async end(id: string, endedBy: string): Promise<Tournament> {
    const tournament = await this.findByIdOrFail(id);
    if (tournament.status !== TournamentStatus.IN_PROGRESS) {
      throw new BadRequestException('Only in-progress tournaments can be ended');
    }

    tournament.status = TournamentStatus.ENDED;
    tournament.endedAt = new Date();
    tournament.endedBy = endedBy;
    await this.tournamentRepository.save(tournament);
    this.logger.log(`Ended tournament: ${id} by user ${endedBy}`);
    return this.findByIdOrFail(id);
  }

  /**
   * Delete a tournament
   */
  async delete(id: string): Promise<void> {
    const tournament = await this.findByIdOrFail(id);
    await this.tournamentRepository.remove(tournament);
    this.logger.log(`Deleted tournament: ${id}`);
  }

  /**
   * Assign categories to a tournament. Replaces all currently assigned categories.
   * Any categories previously assigned but not in categoryIds are unassigned.
   */
  async assignCategories(tournamentId: string, categoryIds: string[]): Promise<Tournament> {
    const tournament = await this.tournamentRepository.findOne({
      where: { id: tournamentId },
    });

    if (!tournament) {
      throw new NotFoundException(`Tournament with ID ${tournamentId} not found`);
    }

    const uniqueCategoryIds = [...new Set(categoryIds)];
    if (uniqueCategoryIds.length !== categoryIds.length) {
      throw new BadRequestException('Duplicate category IDs are not allowed');
    }

    if (uniqueCategoryIds.length > 0) {
      const categories = await this.categoryRepository.find({
        where: { id: In(uniqueCategoryIds) },
      });

      const foundIds = new Set(categories.map((c) => c.id));
      const missingIds = uniqueCategoryIds.filter((id) => !foundIds.has(id));
      if (missingIds.length > 0) {
        throw new BadRequestException(`Category IDs not found: ${missingIds.join(', ')}`);
      }

      const otherClubCategories = categories.filter(
        (category) => category.clubId != null && category.clubId !== tournament.clubId,
      );
      if (otherClubCategories.length > 0) {
        throw new BadRequestException('Cannot assign a category owned by another club to this tournament');
      }
    }

    await this.tournamentCategoryRepository.manager.transaction(async (manager) => {
      await manager.delete(TournamentCategory, { tournamentId });

      if (uniqueCategoryIds.length === 0) {
        return;
      }

      const assignments = uniqueCategoryIds.map((categoryId, index) =>
        manager.create(TournamentCategory, {
          tournamentId,
          categoryId,
          sortOrder: index,
        }),
      );

      await manager.save(TournamentCategory, assignments);
    });

    const saved = await this.findByIdOrFail(tournamentId);
    this.logger.log(`Assigned ${uniqueCategoryIds.length} category(ies) to tournament ${tournamentId}`);
    return saved;
  }

  private findMany(where: FindOptionsWhere<Tournament> | FindOptionsWhere<Tournament>[]): Promise<Tournament[]> {
    return this.tournamentRepository.find({
      where,
      relations: ['createdByUser', 'categoryAssignments', 'categoryAssignments.category', 'club'],
      order: {
        startDate: 'ASC',
        createdAt: 'DESC',
        categoryAssignments: {
          sortOrder: 'ASC',
        },
      },
    });
  }
}
