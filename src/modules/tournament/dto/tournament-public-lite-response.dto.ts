import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

import { TournamentStatus } from '~common/enums';

import { CategoryResponseDto } from '../../category/dto/category-response.dto';
import { Tournament } from '../tournament.entity';

/**
 * Public lite tournament view for registration pages (no auth required).
 */
export class TournamentPublicLiteResponseDto {
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
    description: 'Tournament start date and time',
    example: '2024-06-15T09:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  startDate!: string;

  @Expose()
  @ApiProperty({
    description: 'Tournament location',
    example: 'Paris, France',
  })
  location!: string;

  @Expose()
  @ApiProperty({
    description: 'Registration deadline',
    example: '2024-06-01T23:59:59.000Z',
    type: String,
    format: 'date-time',
  })
  registrationDeadline!: string;

  @Expose()
  @ApiProperty({
    description: 'Public lifecycle status. Pending and declined tournaments are not returned.',
    enum: [TournamentStatus.APPROVED, TournamentStatus.IN_PROGRESS, TournamentStatus.ENDED],
    example: TournamentStatus.APPROVED,
  })
  status!: TournamentStatus.APPROVED | TournamentStatus.IN_PROGRESS | TournamentStatus.ENDED;

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
    description: 'When the tournament was marked ended',
    example: '2024-06-16T18:00:00.000Z',
    type: String,
    format: 'date-time',
    nullable: true,
  })
  endedAt!: string | null;

  @Expose()
  @Type(() => CategoryResponseDto)
  @ApiProperty({
    description: 'Categories assigned to this tournament',
    type: [CategoryResponseDto],
  })
  categories!: CategoryResponseDto[];

  constructor(data: Partial<TournamentPublicLiteResponseDto>) {
    Object.assign(this, data);
  }

  static fromDomain(tournament: Tournament): TournamentPublicLiteResponseDto {
    return new TournamentPublicLiteResponseDto({
      id: tournament.id,
      name: tournament.name,
      location: tournament.location,
      startDate:
        tournament.startDate instanceof Date ? tournament.startDate.toISOString() : String(tournament.startDate || ''),
      registrationDeadline:
        tournament.registrationDeadline instanceof Date
          ? tournament.registrationDeadline.toISOString()
          : String(tournament.registrationDeadline || ''),
      status: tournament.status as TournamentStatus.APPROVED | TournamentStatus.IN_PROGRESS | TournamentStatus.ENDED,
      startedAt:
        tournament.startedAt instanceof Date
          ? tournament.startedAt.toISOString()
          : tournament.startedAt
            ? String(tournament.startedAt)
            : null,
      endedAt:
        tournament.endedAt instanceof Date
          ? tournament.endedAt.toISOString()
          : tournament.endedAt
            ? String(tournament.endedAt)
            : null,
      categories: (tournament.categoryAssignments ?? []).map((assignment) =>
        CategoryResponseDto.fromDomain(assignment.category),
      ),
    });
  }
}
