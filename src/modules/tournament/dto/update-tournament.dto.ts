import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsString, IsOptional, IsUUID, MaxLength, ValidateIf } from 'class-validator';

/**
 * Update Tournament DTO
 * Data transfer object for updating a tournament.
 */
export class UpdateTournamentDto {
  @Expose()
  @ApiPropertyOptional({
    description: 'Tournament name',
    example: 'European Karate Championship 2024',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @Expose()
  @ApiPropertyOptional({
    description: 'Tournament location',
    example: 'Paris, France',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @Expose()
  @ApiPropertyOptional({
    description: 'Tournament start date and time',
    example: '2024-06-15',
    type: String,
    format: 'date',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  startDate?: string | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'Registration deadline',
    example: '2024-06-01',
    type: String,
    format: 'date',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  registrationDeadline?: string | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'Club ID to assign to the tournament (null to unassign)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_o, v) => v != null && v !== '')
  @IsUUID('4')
  clubId?: string | null;
}
