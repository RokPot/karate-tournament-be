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
import { ApiBearerAuth, ApiExtraModels, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Public } from '~common/auth';
import { MailService, type RegistrationEmailFees, type RegistrationEmailItem } from '~common/mail';

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
import { RegistrationResponseDto, TeamMembershipDto } from './dto/registration-response.dto';
import {
  RegistrationSubmissionDetailsDto,
  RegistrationSubmissionGroupDto,
  RegistrationSubmissionParticipantDto,
  RegistrationSubmissionResponseDto,
} from './dto/registration-submission-response.dto';
import { RosterGetQueryDto } from './dto/roster-get-query.dto';
import { RosterIdentityDto } from './dto/roster-identity.dto';
import { RosterLookupResponseDto } from './dto/roster-lookup-response.dto';
import {
  RosterOtpRequestDto,
  RosterOtpResponseDto,
  RosterOtpVerifyDto,
  RosterOtpVerifyResponseDto,
} from './dto/roster-otp.dto';
import { RosterPutDto } from './dto/roster-put.dto';
import { RosterResponseDto } from './dto/roster-response.dto';
import { SuitableCategoriesQueryDto } from './dto/suitable-categories-query.dto';
import { TournamentRegistrationCountsQueryDto } from './dto/tournament-registration-counts-query.dto';
import { TournamentRegistrationCountItemDto } from './dto/tournament-registration-counts-response.dto';
import { TournamentRegistrationsQueryDto } from './dto/tournament-registrations-query.dto';
import { UpdateRegistrationDto } from './dto/update-registration.dto';
import { UserRegistrationsQueryDto } from './dto/user-registrations-query.dto';
import { RegistrationRosterService } from './registration-roster.service';
import { Registration } from './registration.entity';
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
  TeamMembershipDto,
  RegistrationSubmissionDetailsDto,
  RegistrationSubmissionGroupDto,
  RegistrationSubmissionParticipantDto,
  RegistrationSubmissionResponseDto,
  RosterLookupResponseDto,
  RosterOtpResponseDto,
  RosterOtpVerifyResponseDto,
  RosterResponseDto,
)
@Controller('registrations')
@ApiBearerAuth('Authorization')
export class RegistrationController {
  constructor(
    private readonly registrationService: RegistrationService,
    private readonly registrationRosterService: RegistrationRosterService,
    private readonly mailService: MailService,
  ) {}

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

    const email = fullRegistration.user?.email;
    if (email && isDeliverableEmail(email)) {
      await this.mailService.sendRegistrationConfirmation({
        to: email,
        recipientName: fullRegistration.user?.firstName?.trim() || 'there',
        tournamentName: fullRegistration.tournament?.name?.trim() || 'Tournament',
        clubName: clubNameFromRegistrations([fullRegistration]),
        registrations: [toRegistrationEmailItem(fullRegistration)],
        fees: this.emailFeesFor([fullRegistration]),
      });
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

    const email = fullRegistration.user?.email;
    if (email && isDeliverableEmail(email)) {
      await this.mailService.sendRegistrationConfirmation({
        to: email,
        recipientName: fullRegistration.user?.firstName?.trim() || 'there',
        tournamentName: fullRegistration.tournament?.name?.trim() || 'Tournament',
        clubName: clubNameFromRegistrations([fullRegistration]),
        registrations: [toRegistrationEmailItem(fullRegistration)],
        fees: this.emailFeesFor([fullRegistration]),
      });
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
    const successfulRegistrations: Registration[] = [];
    for (const item of results) {
      if (item.success && item.registration) {
        const full = await this.registrationService.findById(item.registration.id);
        if (full) {
          successfulRegistrations.push(full);
        }
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

    if (coach.email && isDeliverableEmail(coach.email) && successfulRegistrations.length > 0) {
      await this.mailService.sendRegistrationConfirmation({
        to: coach.email,
        recipientName: coach.firstName?.trim() || 'there',
        tournamentName: successfulRegistrations[0]?.tournament?.name?.trim() || 'Tournament',
        clubName: clubNameFromRegistrations(successfulRegistrations, dto.clubName),
        registrations: successfulRegistrations.map(toRegistrationEmailItem),
        fees: this.emailFeesFor(successfulRegistrations),
      });
    }

    return BulkPublicRegistrationResponseDto.fromParts(UserResponseDto.fromDomain(coach), mappedResults);
  }

  @Public()
  @Post('public/rosters/lookup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Check whether a public registration roster exists',
    description:
      'Looks up a coach + club roster for a tournament. Returns found + updatedAt only — never participant data.',
  })
  @ApiResponse({ status: 200, description: 'Lookup result', type: RosterLookupResponseDto })
  @ApiResponse({ status: 404, description: 'Tournament not found' })
  async lookupRoster(@Body() dto: RosterIdentityDto): Promise<RosterLookupResponseDto> {
    const result = await this.registrationRosterService.lookup(dto);
    return new RosterLookupResponseDto(result);
  }

  @Public()
  @Post('public/rosters/otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Email a one-time code to continue a registration roster',
    description: 'Sends a 6-digit code to the coach email when a roster exists for this tournament and club.',
  })
  @ApiResponse({
    status: 200,
    description: 'Code sent (debugCode only when mail is disabled outside production)',
    type: RosterOtpResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Roster or tournament not found' })
  @ApiResponse({ status: 429, description: 'Wait before requesting another code' })
  async requestRosterOtp(@Body() dto: RosterOtpRequestDto): Promise<RosterOtpResponseDto> {
    const result = await this.registrationRosterService.requestOtp(dto);
    return new RosterOtpResponseDto(result);
  }

  @Public()
  @Post('public/rosters/otp/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify roster OTP',
    description: 'Exchanges a valid email code for a short-lived accessToken used on GET/PUT current roster.',
  })
  @ApiResponse({ status: 200, description: 'Access token', type: RosterOtpVerifyResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid or expired code' })
  @ApiResponse({ status: 404, description: 'Roster or tournament not found' })
  async verifyRosterOtp(@Body() dto: RosterOtpVerifyDto): Promise<RosterOtpVerifyResponseDto> {
    const result = await this.registrationRosterService.verifyOtp(dto);
    return new RosterOtpVerifyResponseDto(result);
  }

  @Public()
  @Get('public/rosters/current')
  @ApiOperation({
    summary: 'Get the current public registration roster',
    description:
      'Merged latest athletes and teams for the coach + club. Pass accessToken from OTP verify as a query param.',
  })
  @ApiResponse({ status: 200, description: 'Current roster', type: RosterResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid or expired access token' })
  @ApiResponse({ status: 404, description: 'Roster not found' })
  async getCurrentRoster(@Query() query: RosterGetQueryDto): Promise<RosterResponseDto> {
    return this.registrationRosterService.getCurrent(query.accessToken);
  }

  @Public()
  @Put('public/rosters/current')
  @ApiOperation({
    summary: 'Replace the current public registration roster',
    description:
      'Updates athletes and teams in place (no new submission). accessToken and updatedAt are required in the body.',
  })
  @ApiResponse({ status: 200, description: 'Updated roster', type: RosterResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid or expired access token' })
  @ApiResponse({ status: 409, description: 'Roster was updated since load' })
  async putCurrentRoster(@Body() dto: RosterPutDto): Promise<RosterResponseDto> {
    return this.registrationRosterService.putCurrent(dto);
  }

  @Public()
  @Get('public/suitable-categories')
  @ApiOperation({
    summary: 'Get suitable categories by attributes (public)',
    description:
      'Returns tournament categories matching age and belt. Weight is optional and skipped for categories with no weight limits. Optionally pass gender to include gender-restricted categories. No authentication required.',
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
      'Returns each participant with tournament categories they are eligible for (age, belt, gender when provided, and weight when provided). Weight is skipped for categories with no weight limits.',
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
      'Returns each tournament category with participants eligible for it, plus otherEligibleParticipants who only fit a configured feeder category (team categories with a positive feeder limit). Weight is skipped for categories with no weight limits. Participants are matched by request array index via participantIndex.',
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
          otherEligibleParticipants: item.otherEligibleParticipants.map(
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

  @Get('by-tournament/submissions')
  @ApiOperation({
    summary: 'List registration submits for a tournament, grouped by coach and club',
    description:
      'Returns one group per coach + club. Group fees are the combined bill across that coach’s submits (1/2/3+ discounts apply across sends). Nested submits keep this-submit-only fees. Legacy registrations without a submit are omitted (use GET /registrations/by-tournament).',
  })
  @ApiResponse({
    status: 200,
    description: 'Registration submit groups',
    type: [RegistrationSubmissionGroupDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid token' })
  @ApiResponse({ status: 403, description: 'Forbidden - wrong role or another club' })
  @ApiResponse({ status: 404, description: 'Tournament not found' })
  async findSubmissionsByTournament(
    @CurrentUserEntity() currentUser: User,
    @Query() query: TournamentRegistrationCountsQueryDto,
  ): Promise<RegistrationSubmissionGroupDto[]> {
    if (!currentUser) {
      throw new NotFoundException('User not found');
    }
    const groups = await this.registrationService.findSubmissionsByTournament(query.tournamentId, currentUser);
    return groups.map((group) => RegistrationSubmissionGroupDto.fromDomain(group));
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

  @Get('by-user')
  @ApiOperation({
    summary: 'List registrations for a user',
    description:
      "Returns registrations for the given user. Caller must be the user, an admin, or club staff of the user's current club. Optionally filter by tournamentId and status.",
  })
  @ApiResponse({ status: 200, description: 'Registrations list', type: [RegistrationResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid token' })
  @ApiResponse({ status: 403, description: 'Forbidden - wrong role or another club' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findByUser(
    @CurrentUserEntity() currentUser: User,
    @Query() query: UserRegistrationsQueryDto,
  ): Promise<RegistrationResponseDto[]> {
    if (!currentUser) {
      throw new NotFoundException('User not found');
    }
    const registrations = await this.registrationService.findByUserForCaller(query.userId, currentUser, {
      tournamentId: query.tournamentId,
      status: query.status,
    });
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

  @Put(':id')
  @ApiOperation({
    summary: 'Update a registration',
    description:
      'Updates category, final weight, and/or status. Admin, staff of the registering club, or staff of the hosting club. Tournament must be approved or in progress. Category schedule is not updated automatically.',
  })
  @ApiResponse({ status: 200, description: 'Registration updated', type: RegistrationResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed or registration not open' })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid token' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Registration, category, or user not found' })
  @ApiResponse({ status: 409, description: 'Conflict - registration already exists for the new category' })
  async update(
    @CurrentUserEntity() currentUser: User,
    @Param('id') id: string,
    @Body() updateRegistrationDto: UpdateRegistrationDto,
  ): Promise<RegistrationResponseDto> {
    if (!currentUser) {
      throw new NotFoundException('User not found');
    }
    const registration = await this.registrationService.update(id, updateRegistrationDto, currentUser);
    return RegistrationResponseDto.fromDomain(registration);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a registration',
    description:
      'Removes a registration. Admin, staff of the registering club, or staff of the hosting club. Tournament must be approved or in progress. Team roster rows for this registration are removed. Category schedule is not updated automatically.',
  })
  @ApiResponse({ status: 204, description: 'Registration deleted' })
  @ApiResponse({ status: 400, description: 'Bad request - registration not open' })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid token' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Registration not found' })
  async remove(@CurrentUserEntity() currentUser: User, @Param('id') id: string): Promise<void> {
    if (!currentUser) {
      throw new NotFoundException('User not found');
    }
    await this.registrationService.delete(id, currentUser);
  }

  private emailFeesFor(registrations: Registration[]): RegistrationEmailFees | null {
    const tournament = registrations[0]?.tournament;
    if (!tournament) {
      return null;
    }
    const calculation = this.registrationService.feesForRegistrations(tournament, registrations);
    return {
      participants: calculation.participants.map((row) => ({
        name: row.name,
        categoryCount: row.categoryCount,
        amount: row.amount,
      })),
      teams: calculation.teams.map((row) => ({
        name: `${row.name} (${row.categoryName})`,
        amount: row.amount,
      })),
      total: calculation.total,
    };
  }
}

const BULK_PARTICIPANT_EMAIL_SUFFIX = '@bulk.participant.local';

function isDeliverableEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return normalized.length > 0 && !normalized.endsWith(BULK_PARTICIPANT_EMAIL_SUFFIX);
}

function participantDisplayName(user: User | null | undefined): string {
  const parts = [user?.firstName, user?.lastName].filter((part): part is string => Boolean(part?.trim()));
  if (parts.length > 0) {
    return parts.join(' ');
  }
  return user?.email?.trim() || 'Participant';
}

function toRegistrationEmailItem(registration: Registration): RegistrationEmailItem {
  return {
    participantName: participantDisplayName(registration.user),
    tournamentName: registration.tournament?.name?.trim() || 'Tournament',
    categoryName: registration.category?.name?.trim() || 'Category',
    clubName: registration.club?.name ?? null,
  };
}

function clubNameFromRegistrations(registrations: Registration[], fallback?: string | null): string | null {
  const fromFallback = fallback?.trim();
  if (fromFallback) {
    return fromFallback;
  }
  return registrations.find((registration) => registration.club?.name?.trim())?.club?.name?.trim() ?? null;
}
