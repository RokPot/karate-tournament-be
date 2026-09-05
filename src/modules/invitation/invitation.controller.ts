import { Controller, Get, Post, Delete, Param, Query, NotFoundException, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';

import { Public } from '~common/auth';

import { CurrentUserEntity } from '../user/user.decorators';
import { User } from '../user/user.entity';

import { AcceptInvitationResponseDto } from './dto/accept-invitation-response.dto';
import { InvitationByTokenResponseDto } from './dto/invitation-by-token-response.dto';
import { InvitationListItemDto } from './dto/invitation-list-item.dto';
import { InvitationListQueryDto } from './dto/invitation-list-query.dto';
import { InvitationService } from './invitation.service';

/**
 * Invitation Controller
 * GET by-token is public; GET list and POST accept require Auth0 JWT.
 */
@ApiTags('Invitations')
@Controller('invitations')
@ApiBearerAuth('Authorization')
export class InvitationController {
  constructor(private readonly invitationService: InvitationService) {}

  @Get()
  @ApiOperation({
    summary: 'Get invitations',
    description:
      'Lists invitations scoped by role. Admin sees all (optional clubId filter). Club owner/coach see their club. Empty list is 200 [].',
  })
  @ApiResponse({ status: 200, description: 'List of invitations', type: [InvitationListItemDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid token' })
  @ApiResponse({ status: 403, description: 'Forbidden - wrong role or another club' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findAll(
    @CurrentUserEntity() user: User | undefined,
    @Query() query: InvitationListQueryDto,
  ): Promise<InvitationListItemDto[]> {
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const invitations = await this.invitationService.findAll(user, query.clubId);
    return invitations.map((invitation) => InvitationListItemDto.fromDomain(invitation));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Cancel invitation',
    description: 'Cancels a pending invitation. Admin or owner/coach of the invitation club.',
  })
  @ApiParam({ name: 'id', description: 'Invitation ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 204, description: 'Invitation cancelled' })
  @ApiResponse({ status: 400, description: 'Invitation is not pending' })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid token' })
  @ApiResponse({ status: 403, description: 'Forbidden - wrong role or another club' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  async cancel(@Param('id') id: string, @CurrentUserEntity() user: User | undefined): Promise<void> {
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.invitationService.cancel(id, user);
  }

  @Get('by-token/:token')
  @Public()
  @ApiOperation({
    summary: 'Get invitation by token',
    description:
      'Returns invitation details for the given token, including invitee identity. Public. Expired, cancelled, and accepted invites still return 200 with status.',
  })
  @ApiParam({ name: 'token', description: 'Invitation token', example: 'abc123-uuid' })
  @ApiResponse({ status: 200, description: 'Invitation details', type: InvitationByTokenResponseDto })
  @ApiResponse({ status: 404, description: 'Invitation token is unknown' })
  async getByToken(@Param('token') token: string): Promise<InvitationByTokenResponseDto> {
    const invitation = await this.invitationService.findByToken(token);
    if (!invitation) {
      throw new NotFoundException('Invitation not found or no longer valid');
    }
    return InvitationByTokenResponseDto.fromDomain(invitation);
  }

  @Post(':token/accept')
  @ApiOperation({
    summary: 'Accept invitation',
    description:
      'Accepts the invitation: copies empty profile fields from the invite, links the authenticated user to the club, and assigns the invitation role. Requires Auth0 JWT.',
  })
  @ApiParam({ name: 'token', description: 'Invitation token', example: 'abc123-uuid' })
  @ApiResponse({ status: 200, description: 'Invitation accepted', type: AcceptInvitationResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid token' })
  @ApiResponse({ status: 404, description: 'Invitation not found or no longer valid' })
  async accept(
    @Param('token') token: string,
    @CurrentUserEntity() user: User | undefined,
  ): Promise<AcceptInvitationResponseDto> {
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const { user: updatedUser, club } = await this.invitationService.accept(token, user);
    return AcceptInvitationResponseDto.fromDomain(updatedUser, club);
  }
}
