import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

import { InvitationStatus } from '~common/enums';

/**
 * Invitation by token response DTO
 * Returned by GET /invitations/by-token/:token (public).
 */
export class InvitationByTokenResponseDto {
  @Expose()
  @ApiProperty({
    description: 'Club name the user is invited to join',
    example: 'Tokyo Karate Club',
  })
  clubName!: string;

  @Expose()
  @ApiProperty({
    description: 'Invitation expiry timestamp',
    example: '2024-02-08T12:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  expiresAt!: string;

  @Expose()
  @ApiProperty({
    description: 'Invitation status',
    example: 'pending',
    enum: ['pending', 'accepted', 'expired', 'cancelled'],
  })
  status!: string;

  @Expose()
  @ApiProperty({
    description: 'Invitee email',
    example: 'owner@example.com',
  })
  email!: string;

  @Expose()
  @ApiPropertyOptional({ description: 'Invitee first name', example: 'Jane', nullable: true })
  firstName!: string | null;

  @Expose()
  @ApiPropertyOptional({ description: 'Invitee last name', example: 'Doe', nullable: true })
  lastName!: string | null;

  constructor(data: InvitationByTokenResponseDto) {
    Object.assign(this, data);
  }

  static fromDomain(invitation: {
    club: { name: string };
    expiresAt: Date;
    status: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  }): InvitationByTokenResponseDto {
    return new InvitationByTokenResponseDto({
      clubName: invitation.club.name,
      expiresAt:
        invitation.expiresAt instanceof Date
          ? invitation.expiresAt.toISOString()
          : String(invitation.expiresAt),
      status: publicInvitationStatus(invitation.status, invitation.expiresAt),
      email: invitation.email,
      firstName: invitation.firstName,
      lastName: invitation.lastName,
    });
  }
}

function publicInvitationStatus(status: string, expiresAt: Date): string {
  if (status === InvitationStatus.PENDING && new Date() > expiresAt) {
    return InvitationStatus.EXPIRED;
  }
  return status;
}
