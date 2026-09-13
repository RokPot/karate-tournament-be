import {
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiExtraModels, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { isAdmin, isClubStaff } from '~common/auth';

import { TournamentService } from '../tournament/tournament.service';
import { CurrentUserEntity } from '../user/user.decorators';
import { User } from '../user/user.entity';

import { CompetitorRefDto } from './dto/competitor-ref.dto';
import { GameResponseDto } from './dto/game-response.dto';
import { MatchResponseDto } from './dto/match-response.dto';
import { ScheduleResponseDto } from './dto/schedule-response.dto';
import { ScheduleService } from './schedule.service';

@ApiTags('Schedules')
@ApiExtraModels(GameResponseDto, MatchResponseDto, CompetitorRefDto)
@Controller('tournaments/:tournamentId/categories/:categoryId/schedule')
@ApiBearerAuth('Authorization')
export class ScheduleController {
  constructor(
    private readonly scheduleService: ScheduleService,
    private readonly tournamentService: TournamentService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Generate a single-elimination schedule',
    description:
      'Admin or owning club staff. Tournament must be in_progress. Persists one schedule per tournament category. Cannot regenerate while a schedule already exists.',
  })
  @ApiParam({ name: 'tournamentId', description: 'Tournament ID' })
  @ApiParam({ name: 'categoryId', description: 'Category ID' })
  @ApiResponse({ status: 201, description: 'Schedule created', type: ScheduleResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - tournament not in progress or too few participants' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Tournament or category not found' })
  @ApiResponse({ status: 409, description: 'Schedule already exists' })
  async create(
    @CurrentUserEntity() currentUser: User,
    @Param('tournamentId') tournamentId: string,
    @Param('categoryId') categoryId: string,
  ): Promise<ScheduleResponseDto> {
    const caller = this.requireUser(currentUser);
    const tournament = await this.tournamentService.findByIdOrFail(tournamentId);
    this.assertCanMutateSchedule(caller, tournament.clubId);
    const schedule = await this.scheduleService.create(tournamentId, categoryId);
    const competitors = await this.scheduleService.loadCompetitorRefs(schedule);
    return ScheduleResponseDto.fromDomain(schedule, competitors);
  }

  @Get()
  @ApiOperation({
    summary: 'Get the schedule for a tournament category',
    description: 'Admin or owning club staff.',
  })
  @ApiParam({ name: 'tournamentId', description: 'Tournament ID' })
  @ApiParam({ name: 'categoryId', description: 'Category ID' })
  @ApiResponse({ status: 200, description: 'Schedule found', type: ScheduleResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Tournament, category, or schedule not found' })
  async findOne(
    @CurrentUserEntity() currentUser: User,
    @Param('tournamentId') tournamentId: string,
    @Param('categoryId') categoryId: string,
  ): Promise<ScheduleResponseDto> {
    const caller = this.requireUser(currentUser);
    const tournament = await this.tournamentService.findByIdOrFail(tournamentId);
    this.assertCanMutateSchedule(caller, tournament.clubId);
    const schedule = await this.scheduleService.findByTournamentAndCategoryOrFail(tournamentId, categoryId);
    const competitors = await this.scheduleService.loadCompetitorRefs(schedule);
    return ScheduleResponseDto.fromDomain(schedule, competitors);
  }

  private requireUser(user: User | undefined): User {
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  private assertCanMutateSchedule(user: User, clubId: string | null): void {
    if (isAdmin(user.roles)) {
      return;
    }
    if (isClubStaff(user.roles) && user.clubId && clubId === user.clubId) {
      return;
    }
    throw new ForbiddenException('Insufficient permissions to access this schedule');
  }
}
