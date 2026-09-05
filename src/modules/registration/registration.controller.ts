import { Body, Controller, Get, NotFoundException, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiExtraModels, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Public } from '~common/auth';

import { CategoryResponseDto } from '../category/dto/category-response.dto';
import { UserResponseDto } from '../user/dto/user-response.dto';
import { CurrentUserEntity } from '../user/user.decorators';
import { User } from '../user/user.entity';

import { BulkParticipantDto } from './dto/bulk-participant.dto';
import {
  BulkPublicRegistrationResponseDto,
  BulkRegistrationResultItemDto,
} from './dto/bulk-public-registration-response.dto';
import { BulkPublicRegistrationDto } from './dto/bulk-public-registration.dto';
import { BulkPublicSuitableCategoriesDto } from './dto/bulk-public-suitable-categories.dto';
import {
  CategorySuitableParticipantsItemDto,
  SuitableParticipantDto,
} from './dto/category-suitable-participants-response.dto';
import { CreateRegistrationWithUserDto } from './dto/create-registration-with-user.dto';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { MyRegistrationsQueryDto } from './dto/my-registrations-query.dto';
import { PublicParticipantProfileDto } from './dto/public-participant-profile.dto';
import { PublicParticipantSuitableCategoriesItemDto } from './dto/public-participant-suitable-categories-response.dto';
import { PublicSuitableCategoriesQueryDto } from './dto/public-suitable-categories-query.dto';
import { RegistrationResponseDto } from './dto/registration-response.dto';
import { SuitableCategoriesQueryDto } from './dto/suitable-categories-query.dto';
import { TournamentRegistrationCountsQueryDto } from './dto/tournament-registration-counts-query.dto';
import { TournamentRegistrationCountItemDto } from './dto/tournament-registration-counts-response.dto';
import { TournamentRegistrationsQueryDto } from './dto/tournament-registrations-query.dto';
import { RegistrationService } from './registration.service';

/**
 * Registration Controller
 * Handles HTTP requests for registration operations.
 */
@ApiTags('Registrations')
@ApiExtraModels(
  BulkPublicRegistrationDto,
  BulkParticipantDto,
  PublicParticipantProfileDto,
  BulkPublicSuitableCategoriesDto,
  PublicParticipantSuitableCategoriesItemDto,
  CategorySuitableParticipantsItemDto,
  SuitableParticipantDto,
)
@Controller('registrations')
@ApiBearerAuth('Authorization')
export class RegistrationController {
  constructor(private readonly registrationService: RegistrationService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new registration',
    description:
      'Creates a new registration for the authenticated user or a specified user (for coaches registering athletes)',
  })
  @ApiResponse({ status: 201, description: 'Registration created', type: RegistrationResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid token' })
  @ApiResponse({ status: 404, description: 'Not found - tournament, category, club, or user not found' })
  @ApiResponse({ status: 409, description: 'Conflict - registration already exists' })
  async create(
    @CurrentUserEntity() currentUser: User,
    @Body() createRegistrationDto: CreateRegistrationDto,
  ): Promise<RegistrationResponseDto> {
    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    const registration = await this.registrationService.create(createRegistrationDto, currentUser.id);
    const fullRegistration = await this.registrationService.findById(registration.id);

    if (!fullRegistration) {
      throw new NotFoundException('Registration not found after creation');
    }

    return RegistrationResponseDto.fromDomain(fullRegistration);
  }

  @Public()
  @Post('public')
  @ApiOperation({
    summary: 'Create a registration with user information (public)',
    description:
      'Creates a user from email/name and then creates a registration. This endpoint is public and does not require authentication.',
  })
  @ApiResponse({ status: 201, description: 'Registration created', type: RegistrationResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 404, description: 'Not found - tournament, category, or club not found' })
  @ApiResponse({ status: 409, description: 'Conflict - registration already exists' })
  async createWithUser(
    @Body() createRegistrationWithUserDto: CreateRegistrationWithUserDto,
  ): Promise<RegistrationResponseDto> {
    const registration = await this.registrationService.createWithUser(createRegistrationWithUserDto);
    const fullRegistration = await this.registrationService.findById(registration.id);

    if (!fullRegistration) {
      throw new NotFoundException('Registration not found after creation');
    }

    return RegistrationResponseDto.fromDomain(fullRegistration);
  }

  @Public()
  @Post('public/bulk')
  @ApiOperation({
    summary: 'Bulk register participants with coach (public)',
    description:
      'Creates or updates a coach user, then registers multiple participants. Partial success: failed items are returned in results with error messages.',
  })
  @ApiResponse({ status: 201, description: 'Bulk registration processed', type: BulkPublicRegistrationResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 404, description: 'Tournament not found' })
  async bulkCreateWithCoach(@Body() dto: BulkPublicRegistrationDto): Promise<BulkPublicRegistrationResponseDto> {
    const { coach, results } = await this.registrationService.bulkCreateWithCoach(dto);

    const mappedResults: BulkRegistrationResultItemDto[] = [];
    for (const item of results) {
      if (item.success && item.registration) {
        const full = await this.registrationService.findById(item.registration.id);
        mappedResults.push(
          BulkRegistrationResultItemDto.fromData({
            participantIndex: item.participantIndex,
            registrationIndex: item.registrationIndex,
            teamIndex: item.teamIndex,
            success: true,
            registration: full ? RegistrationResponseDto.fromDomain(full) : undefined,
          }),
        );
      } else {
        mappedResults.push(
          BulkRegistrationResultItemDto.fromData({
            participantIndex: item.participantIndex,
            registrationIndex: item.registrationIndex,
            teamIndex: item.teamIndex,
            success: false,
            error: item.error,
          }),
        );
      }
    }

    return BulkPublicRegistrationResponseDto.fromParts(UserResponseDto.fromDomain(coach), mappedResults);
  }

  @Public()
  @Get('public/suitable-categories')
  @ApiOperation({
    summary: 'Get suitable categories by attributes (public)',
    description:
      'Returns tournament categories matching weight, age, and belt. Optionally pass gender to include gender-restricted categories. No authentication required.',
  })
  @ApiResponse({ status: 200, description: 'Suitable categories', type: [CategoryResponseDto] })
  @ApiResponse({ status: 404, description: 'Tournament not found' })
  async getPublicSuitableCategories(@Query() query: PublicSuitableCategoriesQueryDto): Promise<CategoryResponseDto[]> {
    const categories = await this.registrationService.getSuitableCategoriesForAttributes(
      query.tournamentId,
      query.weight,
      query.beltLevel,
      query.dateOfBirth,
      query.gender,
    );
    return categories.map((c) => CategoryResponseDto.fromDomain(c));
  }

  @Public()
  @Post('public/suitable-categories/bulk')
  @ApiOperation({
    summary: 'Get suitable categories for multiple participants (public)',
    description:
      'Returns each participant with tournament categories they are eligible for (weight, age, belt, and gender when provided).',
  })
  @ApiResponse({
    status: 200,
    description: 'Suitable categories per participant',
    type: [PublicParticipantSuitableCategoriesItemDto],
  })
  @ApiResponse({ status: 404, description: 'Tournament not found' })
  async getBulkPublicSuitableCategories(
    @Body() dto: BulkPublicSuitableCategoriesDto,
  ): Promise<PublicParticipantSuitableCategoriesItemDto[]> {
    const items = await this.registrationService.getBulkSuitableCategoriesForAttributes(
      dto.tournamentId,
      dto.participants,
    );

    return items.map(
      (item) =>
        new PublicParticipantSuitableCategoriesItemDto({
          firstName: item.firstName,
          lastName: item.lastName,
          weight: item.weight,
          dateOfBirth: item.dateOfBirth,
          gender: item.gender,
          beltLevel: item.beltLevel ?? null,
          categories: item.categories.map((c) => CategoryResponseDto.fromDomain(c)),
        }),
    );
  }

  @Public()
  @Post('public/suitable-categories/by-category')
  @ApiOperation({
    summary: 'Get suitable participants per category (public)',
    description:
      'Returns each tournament category with participants eligible for it (weight, age, belt, and gender when provided). Participants are matched by request array index via participantIndex.',
  })
  @ApiResponse({
    status: 200,
    description: 'Eligible participants per category',
    type: [CategorySuitableParticipantsItemDto],
  })
  @ApiResponse({ status: 404, description: 'Tournament not found' })
  async getSuitableParticipantsByCategory(
    @Body() dto: BulkPublicSuitableCategoriesDto,
  ): Promise<CategorySuitableParticipantsItemDto[]> {
    const items = await this.registrationService.getSuitableParticipantsByCategory(dto.tournamentId, dto.participants);

    return items.map(
      (item) =>
        new CategorySuitableParticipantsItemDto({
          category: CategoryResponseDto.fromDomain(item.category),
          participants: item.participants.map(
            (p) =>
              new SuitableParticipantDto({
                participantIndex: p.participantIndex,
                firstName: p.firstName,
                lastName: p.lastName,
                weight: p.weight,
                dateOfBirth: p.dateOfBirth,
                gender: p.gender,
                beltLevel: p.beltLevel ?? null,
              }),
          ),
        }),
    );
  }

  @Get('by-tournament/counts')
  @ApiOperation({
    summary: 'Get registration counts per assigned category',
    description:
      'Returns one row per category assigned to the tournament, including categories with zero registrations. Ordered by tournament category sort order.',
  })
  @ApiResponse({
    status: 200,
    description: 'Registration counts per assigned category',
    type: [TournamentRegistrationCountItemDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid token' })
  @ApiResponse({ status: 403, description: 'Forbidden - wrong role or another club' })
  @ApiResponse({ status: 404, description: 'Tournament not found' })
  async findCountsByTournament(
    @CurrentUserEntity() currentUser: User,
    @Query() query: TournamentRegistrationCountsQueryDto,
  ): Promise<TournamentRegistrationCountItemDto[]> {
    if (!currentUser) {
      throw new NotFoundException('User not found');
    }
    const counts = await this.registrationService.findCountsByTournament(query.tournamentId, currentUser);
    return counts.map((item) => TournamentRegistrationCountItemDto.fromData(item.categoryId, item.registrationCount));
  }

  @Get('by-tournament')
  @ApiOperation({
    summary: 'List registrations for a tournament',
    description:
      'Returns all registrations for the given tournament. Optionally filter by categoryId to return only registrations in that category.',
  })
  @ApiResponse({ status: 200, description: 'Registrations list', type: [RegistrationResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid token' })
  @ApiResponse({ status: 403, description: 'Forbidden - wrong role or another club' })
  @ApiResponse({ status: 404, description: 'Tournament or category not found' })
  async findByTournament(
    @CurrentUserEntity() currentUser: User,
    @Query() query: TournamentRegistrationsQueryDto,
  ): Promise<RegistrationResponseDto[]> {
    if (!currentUser) {
      throw new NotFoundException('User not found');
    }
    const registrations = await this.registrationService.findByTournament(
      query.tournamentId,
      query.categoryId,
      currentUser,
    );
    return registrations.map((r) => RegistrationResponseDto.fromDomain(r));
  }

  @Get('suitable-categories')
  @ApiOperation({
    summary: 'Get categories suitable for a user in a tournament',
    description: 'Returns tournament categories for which the user meets weight, age, belt, and gender requirements.',
  })
  @ApiResponse({ status: 200, description: 'Suitable categories', type: [CategoryResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid token' })
  @ApiResponse({ status: 404, description: 'User or tournament not found' })
  async getSuitableCategories(@Query() query: SuitableCategoriesQueryDto): Promise<CategoryResponseDto[]> {
    const categories = await this.registrationService.getSuitableCategoriesForUser(query.userId, query.tournamentId);
    return categories.map((c) => CategoryResponseDto.fromDomain(c));
  }

  @Get('me')
  @ApiOperation({
    summary: 'Get current user registrations',
    description:
      'Returns registrations for the authenticated caller only. Optionally filter by tournamentId and status.',
  })
  @ApiResponse({ status: 200, description: 'Caller registrations', type: [RegistrationResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid token' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findMine(
    @CurrentUserEntity() currentUser: User,
    @Query() query: MyRegistrationsQueryDto,
  ): Promise<RegistrationResponseDto[]> {
    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    const registrations = await this.registrationService.findByUser(currentUser.id, {
      tournamentId: query.tournamentId,
      status: query.status,
    });
    return registrations.map((r) => RegistrationResponseDto.fromDomain(r));
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get registration by ID',
    description: 'Retrieves a specific registration by its ID',
  })
  @ApiResponse({ status: 200, description: 'Registration found', type: RegistrationResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid token' })
  @ApiResponse({ status: 404, description: 'Registration not found' })
  async findOne(@Param('id') id: string): Promise<RegistrationResponseDto> {
    const registration = await this.registrationService.findById(id);
    if (!registration) {
      throw new NotFoundException(`Registration with ID ${id} not found`);
    }
    return RegistrationResponseDto.fromDomain(registration);
  }
}
