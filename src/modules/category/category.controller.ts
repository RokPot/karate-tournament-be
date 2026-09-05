import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUserEntity } from '../user/user.decorators';
import { User } from '../user/user.entity';

import { CategoryService } from './category.service';
import { CategoryListQueryDto } from './dto/category-list-query.dto';
import { CategoryResponseDto } from './dto/category-response.dto';
import { CreateCategoryWithTournamentDto } from './dto/create-category-with-tournament.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { DeleteCategoriesDto } from './dto/delete-categories.dto';
import { DuplicateCategoriesDto } from './dto/duplicate-categories.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

/**
 * Category Controller
 * Handles HTTP requests for category operations.
 */
@ApiTags('Categories')
@Controller('categories')
@ApiBearerAuth('Authorization')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new category',
    description:
      'Creates a new tournament category. Only name and discipline are required; subDiscipline, gender, age, weight, belt limits, and team size (teamSize, teamReservesSize) are optional. clubId is optional for admins (null = global) and defaults to the caller club for club owners.',
  })
  @ApiResponse({ status: 201, description: 'Category created successfully', type: CategoryResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid token' })
  @ApiResponse({ status: 403, description: 'Forbidden - wrong role or another club' })
  @ApiResponse({ status: 404, description: 'User or club not found' })
  async create(
    @CurrentUserEntity() user: User,
    @Body() createCategoryDto: CreateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const currentUser = this.requireUser(user);
    const category = await this.categoryService.create(createCategoryDto, currentUser);
    return CategoryResponseDto.fromDomain(category);
  }

  @Post('create-and-assign')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a category and assign to tournament',
    description:
      'Creates a new category and assigns it to the specified tournament. Only name and discipline are required; subDiscipline, gender, age, weight, belt limits, and team size (teamSize, teamReservesSize) are optional.',
  })
  @ApiResponse({ status: 201, description: 'Category created and assigned successfully', type: CategoryResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid token' })
  @ApiResponse({ status: 403, description: 'Forbidden - wrong role or another club' })
  @ApiResponse({ status: 404, description: 'User, tournament, or club not found' })
  async createAndAssign(
    @CurrentUserEntity() user: User,
    @Body() createCategoryWithTournamentDto: CreateCategoryWithTournamentDto,
  ): Promise<CategoryResponseDto> {
    const currentUser = this.requireUser(user);
    const category = await this.categoryService.createAndAssign(createCategoryWithTournamentDto, currentUser);
    return CategoryResponseDto.fromDomain(category);
  }

  @Post('duplicate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Duplicate categories',
    description:
      'Creates standalone copies of the specified categories. Copies scalar fields only; tournament assignments, registrations, and brackets are not duplicated.',
  })
  @ApiResponse({ status: 201, description: 'Categories duplicated successfully', type: [CategoryResponseDto] })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid token' })
  @ApiResponse({ status: 403, description: 'Forbidden - wrong role or another club' })
  @ApiResponse({ status: 404, description: 'One or more category IDs were not found' })
  async duplicate(
    @CurrentUserEntity() user: User,
    @Body() dto: DuplicateCategoriesDto,
  ): Promise<CategoryResponseDto[]> {
    const currentUser = this.requireUser(user);
    const categories = await this.categoryService.duplicateMany(dto.categoryIds, currentUser);
    return categories.map((category) => CategoryResponseDto.fromDomain(category));
  }

  @Get()
  @ApiOperation({
    summary: 'Get categories',
    description:
      "Lists categories scoped by role. Admin sees all, or filter by clubId / global=true (globals only). Club owner/coach see only their club by default. Pass clubId and includeGlobal=true to list globals and that club's categories.",
  })
  @ApiResponse({ status: 200, description: 'List of categories', type: [CategoryResponseDto] })
  @ApiResponse({
    status: 400,
    description: 'includeGlobal=true without clubId, or global=true combined with includeGlobal=true',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid token' })
  @ApiResponse({ status: 403, description: 'Forbidden - wrong role or another club' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findAll(@CurrentUserEntity() user: User, @Query() query: CategoryListQueryDto): Promise<CategoryResponseDto[]> {
    const currentUser = this.requireUser(user);
    const categories = await this.categoryService.findAll(currentUser, {
      clubId: query.clubId,
      global: query.global,
      includeGlobal: query.includeGlobal,
    });
    return categories.map((category) => CategoryResponseDto.fromDomain(category));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID', description: 'Retrieves a specific category by its ID' })
  @ApiParam({ name: 'id', description: 'Category ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Category found', type: CategoryResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid token' })
  @ApiResponse({ status: 403, description: 'Forbidden - wrong role or another club' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async findOne(@CurrentUserEntity() user: User, @Param('id') id: string): Promise<CategoryResponseDto> {
    const currentUser = this.requireUser(user);
    const category = await this.categoryService.findByIdForUser(id, currentUser);
    return CategoryResponseDto.fromDomain(category);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update category',
    description:
      'Updates an existing category. Omitted fields are left unchanged; send null to clear optional subDiscipline, gender, age, weight, belt limits, or team size fields.',
  })
  @ApiParam({ name: 'id', description: 'Category ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Category updated successfully', type: CategoryResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid token' })
  @ApiResponse({ status: 403, description: 'Forbidden - wrong role or another club' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async update(
    @CurrentUserEntity() user: User,
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const currentUser = this.requireUser(user);
    const category = await this.categoryService.update(id, updateCategoryDto, currentUser);
    return CategoryResponseDto.fromDomain(category);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete categories',
    description:
      'Deletes one or more categories in a single transaction. If any requested category cannot be deleted, the whole operation is rolled back.',
  })
  @ApiResponse({ status: 204, description: 'Categories deleted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid token' })
  @ApiResponse({ status: 403, description: 'Forbidden - wrong role or another club' })
  @ApiResponse({ status: 404, description: 'One or more category IDs were not found' })
  @ApiResponse({
    status: 409,
    description: 'One or more categories could not be deleted because they are used elsewhere',
  })
  async removeMany(@CurrentUserEntity() user: User, @Body() dto: DeleteCategoriesDto): Promise<void> {
    const currentUser = this.requireUser(user);
    await this.categoryService.deleteMany(dto.categoryIds, currentUser);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete category', description: 'Deletes a category by ID' })
  @ApiParam({ name: 'id', description: 'Category ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 204, description: 'Category deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid token' })
  @ApiResponse({ status: 403, description: 'Forbidden - wrong role or another club' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 409, description: 'Category could not be deleted because it is used elsewhere' })
  async remove(@CurrentUserEntity() user: User, @Param('id') id: string): Promise<void> {
    const currentUser = this.requireUser(user);
    await this.categoryService.delete(id, currentUser);
  }

  private requireUser(user: User | undefined): User {
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
