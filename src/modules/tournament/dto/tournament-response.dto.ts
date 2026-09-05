import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

import { TournamentStatus } from '~common/enums';

import { ClubResponseDto } from '../../club/dto/club-response.dto';
import { UserResponseDto } from '../../user/dto/user-response.dto';
import { Tournament } from '../tournament.entity';

/**
 * Tournament Response DTO
 * Data transfer object for tournament responses.
 */
export class TournamentResponseDto {
  @Expose()
  @ApiProperty({
    description: 'Tournament ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @Expose()
  @ApiProperty({
    description: 'Tournament name',
    example: 'European Karate Championship 2024',
  })
  name!: string;

  @Expose()
  @ApiProperty({
    description: 'Tournament location',
    example: 'Paris, France',
  })
  location!: string;

  @Expose()
  @ApiProperty({
    description: 'Tournament start date and time',
    example: '2024-06-15',
    type: String,
    format: 'date',
  })
  startDate!: string;

  @Expose()
  @ApiProperty({
    description: 'Registration deadline',
    example: '2024-06-01',
    type: String,
    format: 'date',
  })
  registrationDeadline!: string;

  @Expose()
  @ApiProperty({
    description: 'User ID who created the tournament',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  createdBy!: string;

  @Expose()
  @Type(() => UserResponseDto)
  @ApiPropertyOptional({
    description: 'User who created the tournament',
    type: UserResponseDto,
    nullable: true,
  })
  createdByUser!: UserResponseDto | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'Club ID assigned to the tournament',
    example: '123e4567-e89b-12d3-a456-426614174000',
    nullable: true,
  })
  clubId!: string | null;

  @Expose()
  @Type(() => ClubResponseDto)
  @ApiPropertyOptional({
    description: 'Club assigned to the tournament',
    type: ClubResponseDto,
    nullable: true,
  })
  club!: ClubResponseDto | null;

  @Expose()
  @ApiProperty({
    description: 'Category IDs associated with this tournament',
    type: [String],
    example: ['123e4567-e89b-12d3-a456-426614174000'],
  })
  categoryIds!: string[];

  @Expose()
  @ApiProperty({
    description: 'Tournament review and lifecycle status',
    enum: TournamentStatus,
    example: TournamentStatus.APPROVED,
  })
  status!: TournamentStatus;

  @Expose()
  @ApiPropertyOptional({
    description: 'When the tournament was last approved or declined',
    example: '2024-01-15T12:00:00.000Z',
    type: String,
    format: 'date-time',
    nullable: true,
  })
  reviewedAt!: string | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'Admin user ID who last approved or declined the tournament',
    example: '123e4567-e89b-12d3-a456-426614174000',
    nullable: true,
  })
  reviewedBy!: string | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'Note from decline or resubmit',
    example: 'Missing venue details',
    nullable: true,
  })
  reviewNote!: string | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'When the tournament was marked in progress',
    example: '2024-06-15T09:00:00.000Z',
    type: String,
    format: 'date-time',
    nullable: true,
  })
  startedAt!: string | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'User ID who marked the tournament in progress',
    example: '123e4567-e89b-12d3-a456-426614174000',
    nullable: true,
  })
  startedBy!: string | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'When the tournament was marked ended',
    example: '2024-06-16T18:00:00.000Z',
    type: String,
    format: 'date-time',
    nullable: true,
  })
  endedAt!: string | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'User ID who marked the tournament ended',
    example: '123e4567-e89b-12d3-a456-426614174000',
    nullable: true,
  })
  endedBy!: string | null;

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

  constructor(data: ITournamentResponseDto) {
    Object.assign(this, data);
  }

  /**
   * Creates a TournamentResponseDto instance from a Tournament entity
   */
  static fromDomain(tournament: Tournament): TournamentResponseDto {
    return new TournamentResponseDto({
      id: tournament.id,
      name: tournament.name,
      location: tournament.location,
      startDate:
        tournament.startDate instanceof Date ? tournament.startDate.toISOString() : String(tournament.startDate || ''),
      registrationDeadline:
        tournament.registrationDeadline instanceof Date
          ? tournament.registrationDeadline.toISOString()
          : String(tournament.registrationDeadline || ''),
      createdBy: tournament.createdBy,
      createdByUser: tournament.createdByUser ? UserResponseDto.fromDomain(tournament.createdByUser) : null,
      clubId: tournament.clubId ?? null,
      club: tournament.club ? ClubResponseDto.fromDomain(tournament.club) : null,
      categoryIds: (tournament.categoryAssignments ?? []).map((assignment) => assignment.categoryId),
      status: tournament.status,
      reviewedAt:
        tournament.reviewedAt instanceof Date
          ? tournament.reviewedAt.toISOString()
          : tournament.reviewedAt
            ? String(tournament.reviewedAt)
            : null,
      reviewedBy: tournament.reviewedBy ?? null,
      reviewNote: tournament.reviewNote ?? null,
      startedAt:
        tournament.startedAt instanceof Date
          ? tournament.startedAt.toISOString()
          : tournament.startedAt
            ? String(tournament.startedAt)
            : null,
      startedBy: tournament.startedBy ?? null,
      endedAt:
        tournament.endedAt instanceof Date
          ? tournament.endedAt.toISOString()
          : tournament.endedAt
            ? String(tournament.endedAt)
            : null,
      endedBy: tournament.endedBy ?? null,
      createdAt:
        tournament.createdAt instanceof Date ? tournament.createdAt.toISOString() : String(tournament.createdAt || ''),
      updatedAt:
        tournament.updatedAt instanceof Date ? tournament.updatedAt.toISOString() : String(tournament.updatedAt || ''),
    });
  }
}

export interface ITournamentResponseDto extends TournamentResponseDto {}
