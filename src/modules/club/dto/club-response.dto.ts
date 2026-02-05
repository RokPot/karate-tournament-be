import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

import { Club } from '../club.entity';

/**
 * Club Response DTO
 * Data transfer object for club responses.
 */
export class ClubResponseDto {
  @Expose()
  @ApiProperty({
    description: 'Club ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @Expose()
  @ApiProperty({
    description: 'Club name',
    example: 'Tokyo Karate Club',
  })
  name!: string;

  @Expose()
  @ApiPropertyOptional({
    description: 'Club address',
    example: '123 Main Street, Tokyo, Japan',
    nullable: true,
  })
  address!: string | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'Club country',
    example: 'Japan',
    nullable: true,
  })
  country!: string | null;

  @Expose()
  @ApiProperty({
    description: 'Number of members (users) in the club',
    example: 42,
  })
  membersCount!: number;

  @Expose()
  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  createdAt!: string;

  @Expose()
  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-01T00:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  updatedAt!: string;

  @Expose()
  @ApiPropertyOptional({
    description: 'Invite URL for club owner (present only when club was created with ownerEmail)',
    example: 'http://localhost:8000/invite/abc123',
    nullable: true,
  })
  inviteUrl!: string | null;

  constructor(data: IClubResponseDto) {
    Object.assign(this, data);
  }

  /**
   * Creates a ClubResponseDto instance from a Club entity
   */
  static fromDomain(club: Club, inviteUrl?: string | null): ClubResponseDto {
    return new ClubResponseDto({
      id: club.id,
      name: club.name,
      address: club.address,
      country: club.country,
      membersCount: club.membersCount ?? 0,
      createdAt: club.createdAt instanceof Date ? club.createdAt.toISOString() : String(club.createdAt || ''),
      updatedAt: club.updatedAt instanceof Date ? club.updatedAt.toISOString() : String(club.updatedAt || ''),
      inviteUrl: inviteUrl ?? null,
    });
  }
}

export interface IClubResponseDto extends ClubResponseDto {}
