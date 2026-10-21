import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, FindOptionsWhere, In, IsNull, QueryFailedError, Repository } from 'typeorm';

import { isAdmin, isClubCoach, isClubOwner, isClubStaff } from '~common/auth';

import { Club } from '../club/club.entity';
import { TournamentCategory } from '../tournament/tournament-category.entity';
import { Tournament } from '../tournament/tournament.entity';
import { User } from '../user/user.entity';

import { CategoryFeeder } from './category-feeder.entity';
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
    @InjectRepository(Club)
    private readonly clubRepository: Repository<Club>,
  ) {}

  /**
   * Create a new category
   */
  async create(data: CreateCategoryDto, user: User): Promise<Category> {
    const clubId = await this.resolveClubIdForCreate(user, data.clubId);
    const teamSize = data.teamSize ?? null;
    const feeders = await this.resolveFeederWrite({
      teamSize,
      feederCategoryIds: data.feederCategoryIds ?? [],
      feederParticipantLimit: data.feederParticipantLimit ?? null,
    });
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
      teamSize,
      teamReservesSize: data.teamReservesSize ?? null,
      feederParticipantLimit: feeders.limit,
      clubId,
    });

    try {
      const saved = await this.categoryRepository.save(category);
      await this.replaceFeeders(saved.id, feeders.ids);
      this.logger.log(`Created category: ${saved.id}`);
      return this.findByIdOrFail(saved.id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to create category: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Find categories scoped by caller role and query filters
   */
  async findAll(
    user: User,
    filters?: { clubId?: string; global?: boolean; includeGlobal?: boolean },
  ): Promise<Category[]> {
    const where = this.resolveListWhere(user, filters);
    return this.categoryRepository.find({
      where,
      relations: ['feeders'],
      order: { name: 'ASC' },
    });
  }

  /**
   * Find a category by ID
   */
  async findById(id: string): Promise<Category | null> {
    return this.categoryRepository.findOne({
      where: { id },
      relations: ['feeders'],
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
   * Find a category by ID if the caller may read it
   */
  async findByIdForUser(id: string, user: User): Promise<Category> {
    const category = await this.findByIdOrFail(id);
    this.assertCanRead(user, category);
    return category;
  }

  /**
   * Duplicate categories as standalone copies.
   */
  async duplicateMany(categoryIds: string[], user: User): Promise<Category[]> {
    this.assertCanMutateCatalog(user);

    const sourceCategories = await this.categoryRepository.find({
      where: { id: In([...new Set(categoryIds)]) },
      relations: ['feeders'],
    });

    const sourceById = new Map(sourceCategories.map((category) => [category.id, category]));
    const missingIds = [...new Set(categoryIds)].filter((id) => !sourceById.has(id));
    if (missingIds.length > 0) {
      throw new NotFoundException(`Category IDs not found: ${missingIds.join(', ')}`);
    }

    for (const id of categoryIds) {
      this.assertCanMutateCategory(user, sourceById.get(id)!);
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
        feederParticipantLimit: source.teamSize != null ? source.feederParticipantLimit : null,
        clubId: source.clubId,
      });
    });

    const saved = await this.categoryRepository.save(duplicates);
    for (let index = 0; index < saved.length; index++) {
      const source = sourceById.get(categoryIds[index])!;
      if (source.teamSize == null) {
        continue;
      }
      const feederIds = (source.feeders ?? []).map((feeder) => feeder.feederCategoryId);
      await this.replaceFeeders(saved[index].id, feederIds);
    }
    this.logger.log(`Duplicated ${saved.length} category(ies)`);
    return this.findManyByIdsInOrder(saved.map((category) => category.id));
  }

  /**
   * Update a category
   */
  async update(id: string, data: UpdateCategoryDto, user: User): Promise<Category> {
    const category = await this.findByIdOrFail(id);
    this.assertCanMutateCategory(user, category);

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

    const touchesFeeders =
      data.teamSize !== undefined || data.feederCategoryIds !== undefined || data.feederParticipantLimit !== undefined;
    let nextFeederIds: string[] | null = null;
    if (touchesFeeders) {
      const teamSize = category.teamSize;
      const feederCategoryIds =
        teamSize == null ? (data.feederCategoryIds ?? []) : (data.feederCategoryIds ?? this.feederIdsOf(category));
      const feederParticipantLimit =
        teamSize == null
          ? (data.feederParticipantLimit ?? null)
          : data.feederParticipantLimit !== undefined
            ? (data.feederParticipantLimit ?? null)
            : (category.feederParticipantLimit ?? null);
      const feeders = await this.resolveFeederWrite({
        teamSize,
        feederCategoryIds,
        feederParticipantLimit,
        selfId: category.id,
      });
      category.feederParticipantLimit = feeders.limit;
      nextFeederIds = feeders.ids;
    }

    if (data.clubId !== undefined) {
      if (!isAdmin(user.roles)) {
        throw new ForbiddenException('Only an admin can change a category club');
      }
      category.clubId = await this.assertClubExists(data.clubId);
    }

    const saved = await this.categoryRepository.save(category);
    if (nextFeederIds) {
      await this.replaceFeeders(saved.id, nextFeederIds);
    }
    return this.findByIdOrFail(saved.id);
  }

  /**
   * Delete a category
   */
  async delete(id: string, user: User): Promise<void> {
    await this.deleteMany([id], user);
  }

  /**
   * Delete categories in a single transaction.
   */
  async deleteMany(categoryIds: string[], user: User): Promise<void> {
    this.assertCanMutateCatalog(user);

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

        for (const category of categories) {
          this.assertCanMutateCategory(user, category);
        }

        await manager.remove(Category, categories);
      });
      this.logger.log(`Deleted ${categoryIds.length} category(ies)`);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
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
  async createAndAssign(data: CreateCategoryWithTournamentDto, user: User): Promise<Category> {
    const tournament = await this.tournamentRepository.findOne({
      where: { id: data.tournamentId },
    });

    if (!tournament) {
      throw new NotFoundException(`Tournament with ID ${data.tournamentId} not found`);
    }

    let clubId: string | null;
    if (isClubCoach(user.roles) && !isAdmin(user.roles) && !isClubOwner(user.roles)) {
      if (!user.clubId || tournament.clubId !== user.clubId) {
        throw new ForbiddenException('Insufficient permissions to assign a category to this tournament');
      }
      clubId = user.clubId;
    } else {
      clubId = await this.resolveClubIdForCreate(user, data.clubId);
    }
    const teamSize = data.teamSize ?? null;
    const feeders = await this.resolveFeederWrite({
      teamSize,
      feederCategoryIds: data.feederCategoryIds ?? [],
      feederParticipantLimit: data.feederParticipantLimit ?? null,
    });
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
      teamSize,
      teamReservesSize: data.teamReservesSize ?? null,
      feederParticipantLimit: feeders.limit,
      clubId,
    });

    try {
      const saved = await this.categoryRepository.manager.transaction(async (manager) => {
        const savedCategory = await manager.save(Category, category);
        await this.replaceFeeders(savedCategory.id, feeders.ids, manager);
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
      return this.findByIdOrFail(saved.id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to create and assign category: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  private resolveListWhere(
    user: User,
    filters?: { clubId?: string; global?: boolean; includeGlobal?: boolean },
  ): FindOptionsWhere<Category> | FindOptionsWhere<Category>[] | undefined {
    const includeGlobal = filters?.includeGlobal === true;
    const globalOnly = filters?.global === true;

    if (includeGlobal && globalOnly) {
      throw new BadRequestException('global and includeGlobal cannot be used together');
    }
    if (includeGlobal && !filters?.clubId) {
      throw new BadRequestException('includeGlobal requires clubId');
    }

    if (isAdmin(user.roles)) {
      if (globalOnly) {
        return { clubId: IsNull() };
      }
      if (includeGlobal && filters?.clubId) {
        return this.unionClubAndGlobal(filters.clubId);
      }
      if (filters?.clubId) {
        return { clubId: filters.clubId };
      }
      return undefined;
    }

    if (isClubStaff(user.roles)) {
      if (!user.clubId) {
        throw new ForbiddenException('User is not associated with a club');
      }
      if (globalOnly) {
        throw new ForbiddenException('Cannot list global categories');
      }
      if (filters?.clubId && filters.clubId !== user.clubId) {
        throw new ForbiddenException('Cannot list categories for another club');
      }
      if (includeGlobal) {
        return this.unionClubAndGlobal(user.clubId);
      }
      return { clubId: user.clubId };
    }

    throw new ForbiddenException('Insufficient permissions to list categories');
  }

  private unionClubAndGlobal(clubId: string): FindOptionsWhere<Category>[] {
    return [{ clubId: IsNull() }, { clubId }];
  }

  private feederIdsOf(category: Category): string[] {
    return (category.feeders ?? []).map((feeder) => feeder.feederCategoryId);
  }

  private async findManyByIdsInOrder(ids: string[]): Promise<Category[]> {
    if (ids.length === 0) {
      return [];
    }
    const rows = await this.categoryRepository.find({
      where: { id: In(ids) },
      relations: ['feeders'],
    });
    const byId = new Map(rows.map((category) => [category.id, category]));
    return ids.map((id) => byId.get(id)!);
  }

  private async resolveFeederWrite(params: {
    teamSize: number | null;
    feederCategoryIds: string[];
    feederParticipantLimit: number | null;
    selfId?: string;
  }): Promise<{ ids: string[]; limit: number | null }> {
    if (params.teamSize == null) {
      if (
        params.feederCategoryIds.length > 0 ||
        (params.feederParticipantLimit != null && params.feederParticipantLimit > 0)
      ) {
        throw new BadRequestException('Feeder categories are only allowed when teamSize is set');
      }
      return { ids: [], limit: null };
    }

    if (new Set(params.feederCategoryIds).size !== params.feederCategoryIds.length) {
      throw new BadRequestException('feederCategoryIds contains duplicates');
    }
    if (params.selfId && params.feederCategoryIds.includes(params.selfId)) {
      throw new BadRequestException('A category cannot list itself as a feeder');
    }

    await this.assertCategoriesExist(params.feederCategoryIds);
    return { ids: params.feederCategoryIds, limit: params.feederParticipantLimit };
  }

  private async assertCategoriesExist(ids: string[]): Promise<void> {
    if (ids.length === 0) {
      return;
    }
    const found = await this.categoryRepository.find({
      where: { id: In(ids) },
      select: ['id'],
    });
    const foundIds = new Set(found.map((category) => category.id));
    const missing = ids.filter((id) => !foundIds.has(id));
    if (missing.length > 0) {
      throw new NotFoundException(`Category IDs not found: ${missing.join(', ')}`);
    }
  }

  private async replaceFeeders(
    categoryId: string,
    feederCategoryIds: string[],
    manager?: EntityManager,
  ): Promise<void> {
    const entityManager = manager ?? this.categoryRepository.manager;
    await entityManager.delete(CategoryFeeder, { categoryId });
    if (feederCategoryIds.length === 0) {
      return;
    }
    await entityManager.save(
      CategoryFeeder,
      feederCategoryIds.map((feederCategoryId) =>
        entityManager.create(CategoryFeeder, { categoryId, feederCategoryId }),
      ),
    );
  }

  private async resolveClubIdForCreate(user: User, requestedClubId?: string | null): Promise<string | null> {
    this.assertCanMutateCatalog(user);

    if (isAdmin(user.roles)) {
      return this.assertClubExists(requestedClubId ?? null);
    }

    if (requestedClubId === null) {
      throw new ForbiddenException('Club owners cannot create global categories');
    }

    const clubId = requestedClubId ?? user.clubId;
    if (!clubId) {
      throw new ForbiddenException('User is not associated with a club');
    }
    if (clubId !== user.clubId) {
      throw new ForbiddenException('Cannot create a category for another club');
    }

    return this.assertClubExists(clubId);
  }

  private async assertClubExists(clubId: string | null): Promise<string | null> {
    if (!clubId) {
      return null;
    }
    const club = await this.clubRepository.findOne({ where: { id: clubId } });
    if (!club) {
      throw new NotFoundException(`Club with ID ${clubId} not found`);
    }
    return clubId;
  }

  private assertCanMutateCatalog(user: User): void {
    if (isAdmin(user.roles) || isClubOwner(user.roles)) {
      return;
    }
    throw new ForbiddenException('Insufficient permissions to mutate categories');
  }

  private assertCanRead(user: User, category: Category): void {
    if (isAdmin(user.roles)) {
      return;
    }
    if (isClubStaff(user.roles) && user.clubId && category.clubId === user.clubId) {
      return;
    }
    throw new ForbiddenException('Cannot access this category');
  }

  private assertCanMutateCategory(user: User, category: Category): void {
    this.assertCanMutateCatalog(user);

    if (isAdmin(user.roles)) {
      return;
    }

    if (!user.clubId || category.clubId !== user.clubId) {
      throw new ForbiddenException('Cannot mutate a global category or a category owned by another club');
    }
  }
}
