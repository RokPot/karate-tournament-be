import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';

import { CategoryService } from './category.service';
import { CategoryResponseDto } from './dto/category-response.dto';
import { CreateCategoryWithTournamentDto } from './dto/create-category-with-tournament.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
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
  @ApiOperation({ summary: 'Create a new category', description: 'Creates a new tournament category' })
  @ApiResponse({ status: 201, description: 'Category created successfully', type: CategoryResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid token' })
  async create(@Body() createCategoryDto: CreateCategoryDto): Promise<CategoryResponseDto> {
    const category = await this.categoryService.create(createCategoryDto);
    return CategoryResponseDto.fromDomain(category);
  }

  @Post('create-and-assign')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a category and assign to tournament',
    description: 'Creates a new category and assigns it to the specified tournament',
  })
  @ApiResponse({ status: 201, description: 'Category created and assigned successfully', type: CategoryResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid token' })
  @ApiResponse({ status: 404, description: 'Tournament not found' })
  async createAndAssign(
    @Body() createCategoryWithTournamentDto: CreateCategoryWithTournamentDto,
  ): Promise<CategoryResponseDto> {
    const category = await this.categoryService.createAndAssign(createCategoryWithTournamentDto);
    return CategoryResponseDto.fromDomain(category);
  }

  @Get()
  @ApiOperation({ summary: 'Get all categories', description: 'Retrieves a list of all categories' })
  @ApiResponse({ status: 200, description: 'List of categories', type: [CategoryResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid token' })
  async findAll(): Promise<CategoryResponseDto[]> {
    const categories = await this.categoryService.findAll();
    return categories.map((category) => CategoryResponseDto.fromDomain(category));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID', description: 'Retrieves a specific category by its ID' })
  @ApiParam({ name: 'id', description: 'Category ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Category found', type: CategoryResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid token' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async findOne(@Param('id') id: string): Promise<CategoryResponseDto> {
    const category = await this.categoryService.findByIdOrFail(id);
    return CategoryResponseDto.fromDomain(category);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update category', description: 'Updates an existing category' })
  @ApiParam({ name: 'id', description: 'Category ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Category updated successfully', type: CategoryResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid token' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto): Promise<CategoryResponseDto> {
    const category = await this.categoryService.update(id, updateCategoryDto);
    return CategoryResponseDto.fromDomain(category);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete category', description: 'Deletes a category by ID' })
  @ApiParam({ name: 'id', description: 'Category ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 204, description: 'Category deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid token' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.categoryService.delete(id);
  }
}
