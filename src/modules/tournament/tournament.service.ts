import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
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
  ) {}

  /**
   * Create a new tournament
   */
  async create(data: CreateTournamentDto, createdByUserId: string): Promise<Tournament> {
    // Convert string dates to Date objects
    const startDate = new Date(data.startDate);
    const registrationDeadline = new Date(data.registrationDeadline);

    const tournament = this.tournamentRepository.create({
      name: data.name,
      location: data.location,
      startDate,
      registrationDeadline,
      createdBy: createdByUserId,
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
      relations: ['createdByUser', 'categories'],
      order: { startDate: 'ASC', createdAt: 'DESC' },
    });
  }

  /**
   * Find a tournament by ID
   */
  async findById(id: string): Promise<Tournament | null> {
    return this.tournamentRepository.findOne({
      where: { id },
      relations: ['createdByUser', 'categories'],
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
}
