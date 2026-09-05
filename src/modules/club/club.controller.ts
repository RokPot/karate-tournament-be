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
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';

import { requireAdmin, requireClubMember, requireClubStaffOf } from '~common/auth';
import { UserRole } from '~common/enums';

import { CreateClubInvitationDto } from '../invitation/dto/create-club-invitation.dto';
import { InvitationCreatedResponseDto } from '../invitation/dto/invitation-created-response.dto';
import { InvitationService } from '../invitation/invitation.service';
import { TournamentResponseDto } from '../tournament/dto/tournament-response.dto';
import { CurrentUserEntity } from '../user/user.decorators';
import { User } from '../user/user.entity';
import { UserResponseDto } from '../user/dto/user-response.dto';

import { ClubService } from './club.service';
import { AddMemberDto } from './dto/add-member.dto';
import { ClubResponseDto } from './dto/club-response.dto';
import { CreateClubDto } from './dto/create-club.dto';
import { GetMembersQueryDto } from './dto/get-members-query.dto';
import { UpdateClubDto } from './dto/update-club.dto';

/**
 * Club Controller
 * Handles HTTP requests for club operations.
 */
@ApiTags('Clubs')
@Controller('clubs')
@ApiBearerAuth('Authorization')
export class ClubController {
  constructor(
    private readonly clubService: ClubService,
    private readonly invitationService: InvitationService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new club',
    description:
      'Creates a new karate club. When ownerEmail is provided, an invitation is created and inviteUrl is returned.',
  })
  @ApiResponse({ status: 201, description: 'Club created successfully', type: ClubResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid token' })
  async create(@Body() createClubDto: CreateClubDto): Promise<ClubResponseDto> {
    const { club, inviteUrl } = await this.clubService.create(createClubDto);
    return ClubResponseDto.fromDomain(club, inviteUrl);
  }

  @Get()
  @ApiOperation({ summary: 'Get all clubs', description: 'Retrieves a list of all clubs' })
  @ApiResponse({ status: 200, description: 'List of clubs', type: [ClubResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid token' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  async findAll(@CurrentUserEntity() currentUser: User): Promise<ClubResponseDto[]> {
    const user = this.requireUser(currentUser);
    requireAdmin(user.roles);
    const clubs = await this.clubService.findAll();
    return clubs.map((club) => ClubResponseDto.fromDomain(club));
  }

  @Post(':id/members')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add a member to the club',
    description:
      'Creates a new user (without Auth0) and adds them to the club with the given role. The user can be linked to Auth0 later.',
  })
  @ApiParam({ name: 'id', description: 'Club ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 201, description: 'Member created and added to club', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid token' })
  @ApiResponse({ status: 404, description: 'Club not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - wrong role or another club' })
  async addMember(
    @CurrentUserEntity() currentUser: User,
    @Param('id') id: string,
    @Body() addMemberDto: AddMemberDto,
  ): Promise<UserResponseDto> {
    const caller = this.requireUser(currentUser);
    requireClubStaffOf(caller.roles, caller.clubId, id);
    const member = await this.clubService.addMember(id, addMemberDto);
    return UserResponseDto.fromDomain(member);
  }

  @Post(':id/invitations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Invite a user to an existing club',
    description:
      'Creates an invitation for the club. Admin, or club owner/coach of this club. Default role is club_member.',
  })
  @ApiParam({ name: 'id', description: 'Club ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 201, description: 'Invitation created', type: InvitationCreatedResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid token' })
  @ApiResponse({ status: 403, description: 'Forbidden - wrong role or another club' })
  @ApiResponse({ status: 404, description: 'Club or user not found' })
  @ApiResponse({ status: 409, description: 'Pending invitation or existing member' })
  async createInvitation(
    @CurrentUserEntity() currentUser: User,
    @Param('id') id: string,
    @Body() dto: CreateClubInvitationDto,
  ): Promise<InvitationCreatedResponseDto> {
    if (!currentUser) {
      throw new NotFoundException('User not found');
    }
    requireClubStaffOf(currentUser.roles, currentUser.clubId, id);

    const { invitation, inviteUrl } = await this.invitationService.createForExistingClub(
      id,
      dto.email,
      dto.firstName,
      dto.lastName,
      dto.role ?? UserRole.CLUB_MEMBER,
    );
    return InvitationCreatedResponseDto.fromInvitation(invitation, inviteUrl);
  }

  @Get(':id/members')
  @ApiOperation({
    summary: 'Get club members',
    description: 'Retrieves users (members) of the club. Optionally filter by role (query param).',
  })
  @ApiParam({ name: 'id', description: 'Club ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiQuery({ name: 'role', required: false, enum: UserRole, description: 'Filter by member role' })
  @ApiResponse({ status: 200, description: 'List of club members', type: [UserResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid token' })
  @ApiResponse({ status: 403, description: 'Forbidden - wrong role or another club' })
  @ApiResponse({ status: 404, description: 'Club not found' })
  async getMembers(
    @CurrentUserEntity() currentUser: User,
    @Param('id') id: string,
    @Query() query: GetMembersQueryDto,
  ): Promise<UserResponseDto[]> {
    const caller = this.requireUser(currentUser);
    requireClubStaffOf(caller.roles, caller.clubId, id);
    const users = await this.clubService.getMembers(id, query.role);
    return users.map((user) => UserResponseDto.fromDomain(user));
  }

  @Get(':id/tournaments')
  @ApiOperation({ summary: 'Get club tournaments', description: 'Retrieves tournaments assigned to the club' })
  @ApiParam({ name: 'id', description: 'Club ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'List of tournaments', type: [TournamentResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid token' })
  @ApiResponse({ status: 403, description: 'Forbidden - wrong role or another club' })
  @ApiResponse({ status: 404, description: 'Club not found' })
  async getTournaments(
    @CurrentUserEntity() currentUser: User,
    @Param('id') id: string,
  ): Promise<TournamentResponseDto[]> {
    const caller = this.requireUser(currentUser);
    requireClubMember(caller.roles, caller.clubId, id);
    const tournaments = await this.clubService.getTournaments(id);
    return tournaments.map((tournament) => TournamentResponseDto.fromDomain(tournament));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get club by ID', description: 'Retrieves a specific club by its ID' })
  @ApiParam({ name: 'id', description: 'Club ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Club found', type: ClubResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid token' })
  @ApiResponse({ status: 403, description: 'Forbidden - wrong role or another club' })
  @ApiResponse({ status: 404, description: 'Club not found' })
  async findOne(@CurrentUserEntity() currentUser: User, @Param('id') id: string): Promise<ClubResponseDto> {
    const caller = this.requireUser(currentUser);
    requireClubMember(caller.roles, caller.clubId, id);
    const club = await this.clubService.findByIdOrFail(id);
    return ClubResponseDto.fromDomain(club);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update club', description: 'Updates an existing club' })
  @ApiParam({ name: 'id', description: 'Club ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'Club updated successfully', type: ClubResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid token' })
  @ApiResponse({ status: 403, description: 'Forbidden - wrong role or another club' })
  @ApiResponse({ status: 404, description: 'Club not found' })
  async update(
    @CurrentUserEntity() currentUser: User,
    @Param('id') id: string,
    @Body() updateClubDto: UpdateClubDto,
  ): Promise<ClubResponseDto> {
    const caller = this.requireUser(currentUser);
    requireClubStaffOf(caller.roles, caller.clubId, id);
    const club = await this.clubService.update(id, updateClubDto);
    return ClubResponseDto.fromDomain(club);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete club', description: 'Deletes a club by ID' })
  @ApiParam({ name: 'id', description: 'Club ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 204, description: 'Club deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid token' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  @ApiResponse({ status: 404, description: 'Club not found' })
  async remove(@CurrentUserEntity() currentUser: User, @Param('id') id: string): Promise<void> {
    const caller = this.requireUser(currentUser);
    requireAdmin(caller.roles);
    await this.clubService.delete(id);
  }

  private requireUser(user: User | undefined): User {
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
