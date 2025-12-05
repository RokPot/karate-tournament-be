import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsString, IsOptional, MaxLength } from 'class-validator';

/**
 * Update Club DTO
 * Data transfer object for updating a club.
 */
export class UpdateClubDto {
  @Expose()
  @ApiPropertyOptional({
    description: 'Club name',
    example: 'Tokyo Karate Club',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @Expose()
  @ApiPropertyOptional({
    description: 'Club address',
    example: '123 Main Street, Tokyo, Japan',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @Expose()
  @ApiPropertyOptional({
    description: 'Club country',
    example: 'Japan',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;
}

