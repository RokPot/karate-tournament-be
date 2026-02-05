import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

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

  constructor(data: InvitationByTokenResponseDto) {
    Object.assign(this, data);
  }

  static fromDomain(invitation: {
    club: { name: string };
    expiresAt: Date;
    status: string;
  }): InvitationByTokenResponseDto {
    return new InvitationByTokenResponseDto({
      clubName: invitation.club.name,
      expiresAt:
        invitation.expiresAt instanceof Date
          ? invitation.expiresAt.toISOString()
          : String(invitation.expiresAt),
      status: invitation.status,
    });
  }
}
