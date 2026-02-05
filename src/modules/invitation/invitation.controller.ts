import { Controller, Get, Post, Param, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';

import { Public } from '~common/auth';

import { CurrentUserEntity } from '../user/user.decorators';
import { User } from '../user/user.entity';

import { AcceptInvitationResponseDto } from './dto/accept-invitation-response.dto';
import { InvitationByTokenResponseDto } from './dto/invitation-by-token-response.dto';
import { InvitationListItemDto } from './dto/invitation-list-item.dto';
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
    summary: 'Get all invitations',
    description: 'Retrieves a list of all invitations, newest first. Requires Auth0 JWT.',
  })
  @ApiResponse({ status: 200, description: 'List of invitations', type: [InvitationListItemDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized - missing or invalid token' })
  async findAll(): Promise<InvitationListItemDto[]> {
    const invitations = await this.invitationService.findAll();
    return invitations.map((invitation) => InvitationListItemDto.fromDomain(invitation));
  }

  @Get('by-token/:token')
  @Public()
  @ApiOperation({
    summary: 'Get invitation by token',
    description:
      'Returns invitation details (club name, expiry) for the given token. Public. Used by frontend to show "You\'re invited to join X" before redirecting to Auth0.',
  })
  @ApiParam({ name: 'token', description: 'Invitation token', example: 'abc123-uuid' })
  @ApiResponse({ status: 200, description: 'Invitation details', type: InvitationByTokenResponseDto })
  @ApiResponse({ status: 404, description: 'Invitation not found or no longer valid' })
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
      'Accepts the invitation: links the authenticated user to the club and assigns club owner role. Requires Auth0 JWT.',
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
