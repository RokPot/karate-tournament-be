import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

import { Invitation } from '../invitation.entity';

import { InvitationListItemDto } from './invitation-list-item.dto';

/**
 * Created invitation plus invite URL for POST /clubs/:id/invitations.
 */
export class InvitationCreatedResponseDto extends InvitationListItemDto {
  @Expose()
  @ApiProperty({
    description: 'Invite URL for the invitee',
    example: 'http://localhost:8000/invite/abc123',
  })
  inviteUrl!: string;

  static fromInvitation(invitation: Invitation, inviteUrl: string): InvitationCreatedResponseDto {
    const item = InvitationListItemDto.fromDomain(invitation);
    return Object.assign(new InvitationCreatedResponseDto(item), { inviteUrl });
  }
}
