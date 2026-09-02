import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, QueryFailedError, Repository } from 'typeorm';

import { TournamentCategory } from '../tournament/tournament-category.entity';
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
      subDiscipline: data.subDiscipline ?? null,
      gender: data.gender ?? null,
      ageMin: data.ageMin ?? null,
      ageMax: data.ageMax ?? null,
      weightMin: data.weightMin ?? null,
      weightMax: data.weightMax ?? null,
      beltMin: data.beltMin ?? null,
      beltMax: data.beltMax ?? null,
      teamSize: data.teamSize ?? null,
      teamReservesSize: data.teamReservesSize ?? null,
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
   * Duplicate categories as standalone copies.
   */
  async duplicateMany(categoryIds: string[]): Promise<Category[]> {
    const sourceCategories = await this.categoryRepository.find({
      where: { id: In([...new Set(categoryIds)]) },
    });

    const sourceById = new Map(sourceCategories.map((category) => [category.id, category]));
    const missingIds = [...new Set(categoryIds)].filter((id) => !sourceById.has(id));
    if (missingIds.length > 0) {
      throw new NotFoundException(`Category IDs not found: ${missingIds.join(', ')}`);
    }

    const duplicates = categoryIds.map((id) => {
      const source = sourceById.get(id)!;
      return this.categoryRepository.create({
        name: `${source.name} (copy)`,
        discipline: source.discipline,
        subDiscipline: source.subDiscipline,
        gender: source.gender,
        ageMin: source.ageMin,
        ageMax: source.ageMax,
        weightMin: source.weightMin,
        weightMax: source.weightMax,
        beltMin: source.beltMin,
        beltMax: source.beltMax,
        teamSize: source.teamSize,
        teamReservesSize: source.teamReservesSize,
      });
    });

    const saved = await this.categoryRepository.save(duplicates);
    this.logger.log(`Duplicated ${saved.length} category(ies)`);
    return saved;
  }

  /**
   * Update a category
   */
  async update(id: string, data: UpdateCategoryDto): Promise<Category> {
    const category = await this.findByIdOrFail(id);

    if (data.name !== undefined) category.name = data.name;
    if (data.discipline !== undefined) category.discipline = data.discipline;
    if (data.subDiscipline !== undefined) category.subDiscipline = data.subDiscipline ?? null;
    if (data.gender !== undefined) category.gender = data.gender ?? null;
    if (data.ageMin !== undefined) category.ageMin = data.ageMin ?? null;
    if (data.ageMax !== undefined) category.ageMax = data.ageMax ?? null;
    if (data.weightMin !== undefined) category.weightMin = data.weightMin ?? null;
    if (data.weightMax !== undefined) category.weightMax = data.weightMax ?? null;
    if (data.beltMin !== undefined) category.beltMin = data.beltMin ?? null;
    if (data.beltMax !== undefined) category.beltMax = data.beltMax ?? null;
    if (data.teamSize !== undefined) category.teamSize = data.teamSize ?? null;
    if (data.teamReservesSize !== undefined) category.teamReservesSize = data.teamReservesSize ?? null;

    return this.categoryRepository.save(category);
  }

  /**
   * Delete a category
   */
  async delete(id: string): Promise<void> {
    await this.deleteMany([id]);
  }

  /**
   * Delete categories in a single transaction.
   */
  async deleteMany(categoryIds: string[]): Promise<void> {
    try {
      await this.categoryRepository.manager.transaction(async (manager) => {
        const categories = await manager.find(Category, {
          where: { id: In([...new Set(categoryIds)]) },
        });

        const foundIds = new Set(categories.map((category) => category.id));
        const missingIds = [...new Set(categoryIds)].filter((id) => !foundIds.has(id));
        if (missingIds.length > 0) {
          throw new NotFoundException(`Category IDs not found: ${missingIds.join(', ')}`);
        }

        await manager.remove(Category, categories);
      });
      this.logger.log(`Deleted ${categoryIds.length} category(ies)`);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof QueryFailedError) {
        throw new ConflictException('One or more categories could not be deleted because they are used elsewhere.');
      }
      throw error;
    }
  }

  /**
   * Create a category and assign it to a tournament
   */
  async createAndAssign(data: CreateCategoryWithTournamentDto): Promise<Category> {
    const tournament = await this.tournamentRepository.findOne({
      where: { id: data.tournamentId },
    });

    if (!tournament) {
      throw new NotFoundException(`Tournament with ID ${data.tournamentId} not found`);
    }

    // Create the category
    const category = this.categoryRepository.create({
      name: data.name,
      discipline: data.discipline,
      subDiscipline: data.subDiscipline ?? null,
      gender: data.gender ?? null,
      ageMin: data.ageMin ?? null,
      ageMax: data.ageMax ?? null,
      weightMin: data.weightMin ?? null,
      weightMax: data.weightMax ?? null,
      beltMin: data.beltMin ?? null,
      beltMax: data.beltMax ?? null,
      teamSize: data.teamSize ?? null,
      teamReservesSize: data.teamReservesSize ?? null,
    });

    try {
      const saved = await this.categoryRepository.manager.transaction(async (manager) => {
        const savedCategory = await manager.save(Category, category);
        const lastAssignment = await manager.findOne(TournamentCategory, {
          where: { tournamentId: data.tournamentId },
          order: { sortOrder: 'DESC' },
        });

        await manager.save(
          TournamentCategory,
          manager.create(TournamentCategory, {
            tournamentId: data.tournamentId,
            categoryId: savedCategory.id,
            sortOrder: (lastAssignment?.sortOrder ?? -1) + 1,
          }),
        );

        return savedCategory;
      });

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
