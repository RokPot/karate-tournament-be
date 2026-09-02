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
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Public } from '~common/auth';

import { CurrentUserEntity } from '../user/user.decorators';
import { User } from '../user/user.entity';

import { AssignCategoriesDto } from './dto/assign-categories.dto';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { TournamentPublicLiteResponseDto } from './dto/tournament-public-lite-response.dto';
import { TournamentResponseDto } from './dto/tournament-response.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { TournamentService } from './tournament.service';

/**
 * Tournament Controller
 * Handles HTTP requests for tournament operations.
 */
@ApiTags('Tournaments')
@Controller('tournaments')
@ApiBearerAuth('Authorization')
export class TournamentController {
  constructor(private readonly tournamentService: TournamentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new tournament', description: 'Creates a new karate tournament' })
  @ApiResponse({ status: 201, description: 'Tournament created successfully', type: TournamentResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid token' })
  async create(
    @CurrentUserEntity() currentUser: User,
    @Body() createTournamentDto: CreateTournamentDto,
  ): Promise<TournamentResponseDto> {
    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    const tournament = await this.tournamentService.create(createTournamentDto, currentUser.id);
    const fullTournament = await this.tournamentService.findById(tournament.id);

    if (!fullTournament) {
      throw new NotFoundException('Tournament not found after creation');
    }

    return TournamentResponseDto.fromDomain(fullTournament);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tournaments', description: 'Retrieves a list of all tournaments' })
  @ApiResponse({ status: 200, description: 'List of tournaments', type: [TournamentResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid token' })
  async findAll(): Promise<TournamentResponseDto[]> {
    const tournaments = await this.tournamentService.findAll();
    return tournaments.map((tournament) => TournamentResponseDto.fromDomain(tournament));
  }

  @Public()
  @Get('public/:id')
  @ApiOperation({
    summary: 'Get tournament (public lite)',
    description: 'Returns tournament name, dates, location, and full category details. No authentication required.',
  })
  @ApiParam({ name: 'id', description: 'Tournament ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Tournament found', type: TournamentPublicLiteResponseDto })
  @ApiResponse({ status: 404, description: 'Tournament not found' })
  async findOnePublic(@Param('id') id: string): Promise<TournamentPublicLiteResponseDto> {
    const tournament = await this.tournamentService.findByIdOrFail(id);
    return TournamentPublicLiteResponseDto.fromDomain(tournament);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tournament by ID', description: 'Retrieves a specific tournament by its ID' })
  @ApiParam({ name: 'id', description: 'Tournament ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Tournament found', type: TournamentResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid token' })
  @ApiResponse({ status: 404, description: 'Tournament not found' })
  async findOne(@Param('id') id: string): Promise<TournamentResponseDto> {
    const tournament = await this.tournamentService.findByIdOrFail(id);
    return TournamentResponseDto.fromDomain(tournament);
  }

  @Put(':id/categories')
  @ApiOperation({
    summary: 'Assign categories to tournament',
    description:
      "Sets the tournament's categories to the given list. Any previously assigned categories not in the list are unassigned, and the array order becomes the tournament-specific display order.",
  })
  @ApiParam({ name: 'id', description: 'Tournament ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Categories assigned successfully', type: TournamentResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - invalid or unknown category IDs' })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid token' })
  @ApiResponse({ status: 404, description: 'Tournament not found' })
  async assignCategories(
    @Param('id') id: string,
    @Body() assignCategoriesDto: AssignCategoriesDto,
  ): Promise<TournamentResponseDto> {
    const tournament = await this.tournamentService.assignCategories(id, assignCategoriesDto.categoryIds);
    const fullTournament = await this.tournamentService.findById(tournament.id);

    if (!fullTournament) {
      throw new NotFoundException('Tournament not found after assigning categories');
    }

    return TournamentResponseDto.fromDomain(fullTournament);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update tournament', description: 'Updates an existing tournament' })
  @ApiParam({ name: 'id', description: 'Tournament ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Tournament updated successfully', type: TournamentResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid token' })
  @ApiResponse({ status: 404, description: 'Tournament not found' })
  async update(
    @Param('id') id: string,
    @Body() updateTournamentDto: UpdateTournamentDto,
  ): Promise<TournamentResponseDto> {
    const tournament = await this.tournamentService.update(id, updateTournamentDto);
    const fullTournament = await this.tournamentService.findById(tournament.id);

    if (!fullTournament) {
      throw new NotFoundException('Tournament not found after update');
    }

    return TournamentResponseDto.fromDomain(fullTournament);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete tournament', description: 'Deletes a tournament by ID' })
  @ApiParam({ name: 'id', description: 'Tournament ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 204, description: 'Tournament deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid token' })
  @ApiResponse({ status: 404, description: 'Tournament not found' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.tournamentService.delete(id);
  }
}
