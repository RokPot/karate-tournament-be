import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Tournament } from '../tournament/tournament.entity';

import { Category } from './category.entity';
import { CreateCategoryWithTournamentDto } from './dto/create-category-with-tournament.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

/**
 * Category Service
 * Handles category-related business logic and database operations.
 */
@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);

  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Tournament)
    private readonly tournamentRepository: Repository<Tournament>,
  ) {}

  /**
   * Create a new category
   */
  async create(data: CreateCategoryDto): Promise<Category> {
    const category = this.categoryRepository.create({
      name: data.name,
      discipline: data.discipline,
      gender: data.gender,
      ageMin: data.ageMin,
      ageMax: data.ageMax,
      weightMin: data.weightMin ?? null,
      weightMax: data.weightMax ?? null,
      beltMin: data.beltMin,
      beltMax: data.beltMax,
    });

    try {
      const saved = await this.categoryRepository.save(category);
      this.logger.log(`Created category: ${saved.id}`);
      return saved;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to create category: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Find all categories
   */
  async findAll(): Promise<Category[]> {
    return this.categoryRepository.find({
      order: { name: 'ASC' },
    });
  }

  /**
   * Find a category by ID
   */
  async findById(id: string): Promise<Category | null> {
    return this.categoryRepository.findOne({
      where: { id },
    });
  }

  /**
   * Find a category by ID or throw if not found
   */
  async findByIdOrFail(id: string): Promise<Category> {
    const category = await this.findById(id);
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  /**
   * Update a category
   */
  async update(id: string, data: UpdateCategoryDto): Promise<Category> {
    const category = await this.findByIdOrFail(id);

    if (data.name !== undefined) category.name = data.name;
    if (data.discipline !== undefined) category.discipline = data.discipline;
    if (data.gender !== undefined) category.gender = data.gender;
    if (data.ageMin !== undefined) category.ageMin = data.ageMin;
    if (data.ageMax !== undefined) category.ageMax = data.ageMax;
    if (data.weightMin !== undefined) category.weightMin = data.weightMin ?? null;
    if (data.weightMax !== undefined) category.weightMax = data.weightMax ?? null;
    if (data.beltMin !== undefined) category.beltMin = data.beltMin;
    if (data.beltMax !== undefined) category.beltMax = data.beltMax;

    return this.categoryRepository.save(category);
  }

  /**
   * Delete a category
   */
  async delete(id: string): Promise<void> {
    const category = await this.findByIdOrFail(id);
    await this.categoryRepository.remove(category);
    this.logger.log(`Deleted category: ${id}`);
  }

  /**
   * Create a category and assign it to a tournament
   */
  async createAndAssign(data: CreateCategoryWithTournamentDto): Promise<Category> {
    // Find the tournament
    const tournament = await this.tournamentRepository.findOne({
      where: { id: data.tournamentId },
      relations: ['categories'],
    });

    if (!tournament) {
      throw new NotFoundException(`Tournament with ID ${data.tournamentId} not found`);
    }

    // Create the category
    const category = this.categoryRepository.create({
      name: data.name,
      discipline: data.discipline,
      gender: data.gender,
      ageMin: data.ageMin,
      ageMax: data.ageMax,
      weightMin: data.weightMin ?? null,
      weightMax: data.weightMax ?? null,
      beltMin: data.beltMin,
      beltMax: data.beltMax,
    });

    try {
      // Save the category
      const saved = await this.categoryRepository.save(category);

      // Assign category to tournament
      if (!tournament.categories) {
        tournament.categories = [];
      }
      tournament.categories.push(saved);
      await this.tournamentRepository.save(tournament);

      this.logger.log(`Created category: ${saved.id} and assigned to tournament: ${data.tournamentId}`);
      return saved;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to create and assign category: ${errorMessage}`, errorStack);
      throw error;
    }
  }
}
