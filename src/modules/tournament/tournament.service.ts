import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { Category } from '../category/category.entity';
import { Club } from '../club/club.entity';

import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { TournamentCategory } from './tournament-category.entity';
import { Tournament } from './tournament.entity';

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
  async create(data: CreateTournamentDto, createdByUserId: string): Promise<Tournament> {
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
    return this.tournamentRepository.find({
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
}
