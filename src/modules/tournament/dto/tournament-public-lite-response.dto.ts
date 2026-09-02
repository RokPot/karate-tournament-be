import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

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
      categories: (tournament.categoryAssignments ?? []).map((assignment) =>
        CategoryResponseDto.fromDomain(assignment.category),
      ),
    });
  }
}
