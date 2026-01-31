import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsString, IsOptional, IsUUID, MaxLength } from 'class-validator';

/**
 * Create Tournament DTO
 * Data transfer object for creating a new tournament.
 */
export class CreateTournamentDto {
  @Expose()
  @ApiProperty({
    description: 'Tournament name',
    example: 'European Karate Championship 2024',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255)
  name!: string;

  @Expose()
  @ApiProperty({
    description: 'Tournament location',
    example: 'Paris, France',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255)
  location!: string;

  @Expose()
  @ApiProperty({
    description: 'Tournament start date and time',
    example: '2024-06-15',
    type: String,
    format: 'date',
  })
  @IsString()
  startDate!: string;

  @Expose()
  @ApiProperty({
    description: 'Registration deadline',
    example: '2024-06-01',
    type: String,
    format: 'date',
  })
  @IsString()
  registrationDeadline!: string;

  @Expose()
  @ApiPropertyOptional({
    description: 'Club ID to assign to the tournament',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('4')
  clubId?: string;
}
