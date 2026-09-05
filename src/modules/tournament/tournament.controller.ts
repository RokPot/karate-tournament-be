import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
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

import { Public, isAdmin, isClubOwner, isClubStaff, requireAdmin, requireClubStaffOf } from '~common/auth';
import { TournamentStatus } from '~common/enums';

import { CurrentUserEntity } from '../user/user.decorators';
import { User } from '../user/user.entity';

import { AssignCategoriesDto } from './dto/assign-categories.dto';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { DeclineTournamentDto } from './dto/decline-tournament.dto';
import { ResubmitTournamentDto } from './dto/resubmit-tournament.dto';
import { TournamentListQueryDto } from './dto/tournament-list-query.dto';
import { TournamentPublicLiteResponseDto } from './dto/tournament-public-lite-response.dto';
import { TournamentResponseDto } from './dto/tournament-response.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { Tournament } from './tournament.entity';
import { TournamentService, isPublicTournamentStatus } from './tournament.service';

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
  @ApiResponse({ status: 403, description: 'Forbidden - wrong role or another club' })
  async create(
    @CurrentUserEntity() currentUser: User,
    @Body() createTournamentDto: CreateTournamentDto,
  ): Promise<TournamentResponseDto> {
    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    let payload = createTournamentDto;
    let status: TournamentStatus;
    if (isAdmin(currentUser.roles)) {
      payload = createTournamentDto;
      status = TournamentStatus.APPROVED;
    } else if (isClubStaff(currentUser.roles)) {
      if (!currentUser.clubId) {
        throw new BadRequestException('User is not associated with a club');
      }
      if (createTournamentDto.clubId && createTournamentDto.clubId !== currentUser.clubId) {
        throw new ForbiddenException('Cannot create a tournament for another club');
      }
      payload = { ...createTournamentDto, clubId: currentUser.clubId };
      status = TournamentStatus.PENDING;
    } else {
      throw new ForbiddenException('Insufficient permissions to create a tournament');
    }

    const tournament = await this.tournamentService.create(payload, currentUser.id, status);
    const fullTournament = await this.tournamentService.findById(tournament.id);

    if (!fullTournament) {
      throw new NotFoundException('Tournament not found after creation');
    }

    return TournamentResponseDto.fromDomain(fullTournament);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all tournaments',
    description: 'Retrieves tournaments visible to the caller. Optional status filter is applied before visibility.',
  })
  @ApiResponse({ status: 200, description: 'List of tournaments', type: [TournamentResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid token' })
  @ApiResponse({ status: 403, description: 'Forbidden - wrong role' })
  async findAll(
    @CurrentUserEntity() currentUser: User,
    @Query() query: TournamentListQueryDto,
  ): Promise<TournamentResponseDto[]> {
    if (!currentUser) {
      throw new NotFoundException('User not found');
    }
    const tournaments = await this.tournamentService.findVisibleToUser(currentUser, query.status);
    return tournaments.map((tournament) => TournamentResponseDto.fromDomain(tournament));
  }

  @Get('registered')
  @ApiOperation({
    summary: 'Get tournaments the current user registered for',
    description:
      'Returns distinct approved, in-progress, or ended tournaments where the authenticated caller has at least one registration (any status).',
  })
  @ApiResponse({ status: 200, description: 'Registered tournaments', type: [TournamentResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid token' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findRegistered(@CurrentUserEntity() currentUser: User): Promise<TournamentResponseDto[]> {
    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    const tournaments = await this.tournamentService.findRegisteredForUser(currentUser.id);
    return tournaments.map((tournament) => TournamentResponseDto.fromDomain(tournament));
  }

  @Public()
  @Get('public/:id')
  @ApiOperation({
    summary: 'Get tournament (public lite)',
    description:
      'Returns tournament name, dates, location, status, and full category details. No authentication required. Pending and declined tournaments are not returned.',
  })
  @ApiParam({ name: 'id', description: 'Tournament ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Tournament found', type: TournamentPublicLiteResponseDto })
  @ApiResponse({ status: 404, description: 'Tournament not found' })
  async findOnePublic(@Param('id') id: string): Promise<TournamentPublicLiteResponseDto> {
    const tournament = await this.tournamentService.findByIdOrFail(id);
    if (!isPublicTournamentStatus(tournament.status)) {
      throw new NotFoundException(`Tournament with ID ${id} not found`);
    }
    return TournamentPublicLiteResponseDto.fromDomain(tournament);
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Approve a tournament request',
    description: 'Admin only. Sets a pending or declined tournament to approved.',
  })
  @ApiParam({ name: 'id', description: 'Tournament ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Tournament approved', type: TournamentResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - already approved' })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid token' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @ApiResponse({ status: 404, description: 'Tournament not found' })
  async approve(@CurrentUserEntity() currentUser: User, @Param('id') id: string): Promise<TournamentResponseDto> {
    const caller = this.requireUser(currentUser);
    requireAdmin(caller.roles);
    const tournament = await this.tournamentService.approve(id, caller.id);
    return TournamentResponseDto.fromDomain(tournament);
  }

  @Post(':id/decline')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Decline a tournament request',
    description: 'Admin only. Declines a pending tournament. Optional reason is stored as reviewNote.',
  })
  @ApiParam({ name: 'id', description: 'Tournament ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Tournament declined', type: TournamentResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - not pending' })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid token' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin role required' })
  @ApiResponse({ status: 404, description: 'Tournament not found' })
  async decline(
    @CurrentUserEntity() currentUser: User,
    @Param('id') id: string,
    @Body() dto: DeclineTournamentDto = {},
  ): Promise<TournamentResponseDto> {
    const caller = this.requireUser(currentUser);
    requireAdmin(caller.roles);
    const tournament = await this.tournamentService.decline(id, caller.id, dto?.reason);
    return TournamentResponseDto.fromDomain(tournament);
  }

  @Post(':id/resubmit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resubmit a declined tournament',
    description: 'Owning club owner or coach only. Sets a declined tournament back to pending.',
  })
  @ApiParam({ name: 'id', description: 'Tournament ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Tournament resubmitted', type: TournamentResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - not declined' })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid token' })
  @ApiResponse({ status: 403, description: 'Forbidden - not the owning club staff' })
  @ApiResponse({ status: 404, description: 'Tournament not found' })
  async resubmit(
    @CurrentUserEntity() currentUser: User,
    @Param('id') id: string,
    @Body() dto: ResubmitTournamentDto = {},
  ): Promise<TournamentResponseDto> {
    const caller = this.requireUser(currentUser);
    const existing = await this.tournamentService.findByIdOrFail(id);
    this.assertCanResubmitTournament(caller, existing);
    const tournament = await this.tournamentService.resubmit(id, dto?.note);
    return TournamentResponseDto.fromDomain(tournament);
  }

  @Post(':id/start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Start a tournament',
    description: 'Admin or owning club staff. Sets an approved tournament to in_progress and closes registration.',
  })
  @ApiParam({ name: 'id', description: 'Tournament ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Tournament started', type: TournamentResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - not approved' })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid token' })
  @ApiResponse({ status: 403, description: 'Forbidden - wrong role or another club' })
  @ApiResponse({ status: 404, description: 'Tournament not found' })
  async start(@CurrentUserEntity() currentUser: User, @Param('id') id: string): Promise<TournamentResponseDto> {
    const caller = this.requireUser(currentUser);
    const existing = await this.tournamentService.findByIdOrFail(id);
    this.assertCanUpdateTournament(caller, existing.clubId);
    const tournament = await this.tournamentService.start(id, caller.id);
    return TournamentResponseDto.fromDomain(tournament);
  }

  @Post(':id/end')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'End a tournament',
    description: 'Admin or owning club staff. Sets an in-progress tournament to ended.',
  })
  @ApiParam({ name: 'id', description: 'Tournament ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Tournament ended', type: TournamentResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - not in progress' })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid token' })
  @ApiResponse({ status: 403, description: 'Forbidden - wrong role or another club' })
  @ApiResponse({ status: 404, description: 'Tournament not found' })
  async end(@CurrentUserEntity() currentUser: User, @Param('id') id: string): Promise<TournamentResponseDto> {
    const caller = this.requireUser(currentUser);
    const existing = await this.tournamentService.findByIdOrFail(id);
    this.assertCanUpdateTournament(caller, existing.clubId);
    const tournament = await this.tournamentService.end(id, caller.id);
    return TournamentResponseDto.fromDomain(tournament);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tournament by ID', description: 'Retrieves a specific tournament by its ID' })
  @ApiParam({ name: 'id', description: 'Tournament ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Tournament found', type: TournamentResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid token' })
  @ApiResponse({ status: 404, description: 'Tournament not found' })
  async findOne(@CurrentUserEntity() currentUser: User, @Param('id') id: string): Promise<TournamentResponseDto> {
    if (!currentUser) {
      throw new NotFoundException('User not found');
    }
    const tournament = await this.tournamentService.findByIdOrFail(id);
    this.assertCanReadTournament(currentUser, tournament);
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
    @CurrentUserEntity() currentUser: User,
    @Param('id') id: string,
    @Body() assignCategoriesDto: AssignCategoriesDto,
  ): Promise<TournamentResponseDto> {
    if (!currentUser) {
      throw new NotFoundException('User not found');
    }
    const existing = await this.tournamentService.findByIdOrFail(id);
    if (existing.clubId) {
      requireClubStaffOf(currentUser.roles, currentUser.clubId, existing.clubId);
    } else if (!isAdmin(currentUser.roles)) {
      throw new ForbiddenException('Insufficient permissions to assign categories');
    }
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
    @CurrentUserEntity() currentUser: User,
    @Param('id') id: string,
    @Body() updateTournamentDto: UpdateTournamentDto,
  ): Promise<TournamentResponseDto> {
    if (!currentUser) {
      throw new NotFoundException('User not found');
    }
    const existing = await this.tournamentService.findByIdOrFail(id);
    this.assertCanUpdateTournament(currentUser, existing.clubId);
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
  async remove(@CurrentUserEntity() currentUser: User, @Param('id') id: string): Promise<void> {
    if (!currentUser) {
      throw new NotFoundException('User not found');
    }
    const existing = await this.tournamentService.findByIdOrFail(id);
    this.assertCanDeleteTournament(currentUser, existing.clubId);
    await this.tournamentService.delete(id);
  }

  private requireUser(user: User | undefined): User {
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  private assertCanReadTournament(user: User, tournament: Tournament): void {
    if (isAdmin(user.roles)) {
      return;
    }
    if (isPublicTournamentStatus(tournament.status)) {
      return;
    }
    if (isClubStaff(user.roles) && user.clubId && tournament.clubId === user.clubId) {
      return;
    }
    throw new NotFoundException(`Tournament with ID ${tournament.id} not found`);
  }

  private assertCanUpdateTournament(user: User, clubId: string | null): void {
    if (isAdmin(user.roles)) {
      return;
    }
    if (isClubStaff(user.roles) && user.clubId && clubId === user.clubId) {
      return;
    }
    throw new ForbiddenException('Insufficient permissions to mutate this tournament');
  }

  private assertCanDeleteTournament(user: User, clubId: string | null): void {
    if (isAdmin(user.roles)) {
      return;
    }
    if (isClubOwner(user.roles) && user.clubId && clubId === user.clubId) {
      return;
    }
    throw new ForbiddenException('Insufficient permissions to mutate this tournament');
  }

  private assertCanResubmitTournament(user: User, tournament: Tournament): void {
    if (isAdmin(user.roles) || !isClubStaff(user.roles) || !user.clubId || tournament.clubId !== user.clubId) {
      throw new ForbiddenException('Insufficient permissions to resubmit this tournament');
    }
  }
}
