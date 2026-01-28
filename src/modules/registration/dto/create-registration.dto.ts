import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsUUID, IsOptional, IsNumber, Min } from 'class-validator';

/**
 * Create Registration DTO
 * Data transfer object for creating a new registration.
 */
export class CreateRegistrationDto {
  @Expose()
  @ApiPropertyOptional({
    description: 'User ID (optional - defaults to authenticated user)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4')
  userId?: string;

  @Expose()
  @ApiProperty({
    description: 'Tournament ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4')
  tournamentId!: string;

  @Expose()
  @ApiProperty({
    description: 'Category ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4')
  categoryId!: string;

  @Expose()
  @ApiProperty({
    description: 'Club ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4')
  clubId!: string;

  @Expose()
  @ApiPropertyOptional({
    description: 'Final weight in kg',
    example: 75.5,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  finalWeight?: number;
}
