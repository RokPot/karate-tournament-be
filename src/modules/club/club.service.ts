import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Club } from './club.entity';

/**
 * Club Service
 * Handles club-related business logic and database operations.
 */
@Injectable()
export class ClubService {
  private readonly logger = new Logger(ClubService.name);

  constructor(
    @InjectRepository(Club)
    private readonly clubRepository: Repository<Club>,
  ) {}

  /**
   * Create a new club
   */
  async create(data: Partial<Club>): Promise<Club> {
    const club = this.clubRepository.create(data);
    return this.clubRepository.save(club);
  }

  /**
   * Find all clubs
   */
  async findAll(): Promise<Club[]> {
    return this.clubRepository.find({
      order: { name: 'ASC' },
    });
  }

  /**
   * Find a club by ID
   */
  async findById(id: string): Promise<Club | null> {
    return this.clubRepository.findOne({
      where: { id },
      relations: ['users'],
    });
  }

  /**
   * Find a club by ID or throw if not found
   */
  async findByIdOrFail(id: string): Promise<Club> {
    const club = await this.findById(id);
    if (!club) {
      throw new NotFoundException(`Club with ID ${id} not found`);
    }
    return club;
  }

  /**
   * Update a club
   */
  async update(id: string, data: Partial<Club>): Promise<Club> {
    const club = await this.findByIdOrFail(id);
    Object.assign(club, data);
    return this.clubRepository.save(club);
  }

  /**
   * Delete a club
   */
  async delete(id: string): Promise<void> {
    const club = await this.findByIdOrFail(id);
    await this.clubRepository.remove(club);
  }
}

