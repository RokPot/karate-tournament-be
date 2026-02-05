import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

/**
 * Invitation list item DTO
 * Returned by GET /invitations (list).
 */
export class InvitationListItemDto {
  @Expose()
  @ApiProperty({
    description: 'Invitation ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @Expose()
  @ApiProperty({
    description: 'Club ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  clubId!: string;

  @Expose()
  @ApiProperty({
    description: 'Club name the user is invited to join',
    example: 'Tokyo Karate Club',
  })
  clubName!: string;

  @Expose()
  @ApiProperty({
    description: 'Invitation token; use to build invite link (e.g. /invite/:token)',
    example: 'abc12345-e89b-12d3-a456-426614174000',
  })
  token!: string;

  @Expose()
  @ApiProperty({
    description: 'Invitee email',
    example: 'owner@example.com',
  })
  email!: string;

  @Expose()
  @ApiProperty({ description: 'Invitee first name', example: 'Jane', nullable: true })
  firstName!: string | null;

  @Expose()
  @ApiProperty({ description: 'Invitee last name', example: 'Doe', nullable: true })
  lastName!: string | null;

  @Expose()
  @ApiProperty({
    description: 'Invitation status',
    example: 'pending',
    enum: ['pending', 'accepted', 'expired', 'cancelled'],
  })
  status!: string;

  @Expose()
  @ApiProperty({
    description: 'When the invitation was created',
    example: '2024-02-01T12:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  createdAt!: string;

  @Expose()
  @ApiProperty({
    description: 'Invitation expiry timestamp',
    example: '2024-02-08T12:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  expiresAt!: string;

  @Expose()
  @ApiPropertyOptional({
    description: 'When the invitation was accepted (if accepted)',
    example: '2024-02-05T14:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  acceptedAt?: string | null;

  constructor(data: InvitationListItemDto) {
    Object.assign(this, data);
  }

  static fromDomain(invitation: {
    id: string;
    clubId: string;
    club: { name: string };
    token: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    status: string;
    createdAt: Date;
    expiresAt: Date;
    acceptedAt?: Date | null;
  }): InvitationListItemDto {
    return new InvitationListItemDto({
      id: invitation.id,
      clubId: invitation.clubId,
      clubName: invitation.club.name,
      token: invitation.token,
      email: invitation.email,
      firstName: invitation.firstName,
      lastName: invitation.lastName,
      status: invitation.status,
      createdAt:
        invitation.createdAt instanceof Date ? invitation.createdAt.toISOString() : String(invitation.createdAt),
      expiresAt:
        invitation.expiresAt instanceof Date ? invitation.expiresAt.toISOString() : String(invitation.expiresAt),
      acceptedAt:
        invitation.acceptedAt != null
          ? invitation.acceptedAt instanceof Date
            ? invitation.acceptedAt.toISOString()
            : String(invitation.acceptedAt)
          : null,
    });
  }
}
