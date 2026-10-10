import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

import { RegistrationStatus } from '~common/enums';

/**
 * Update Registration DTO
 * All fields optional. Cannot change user, tournament, or club.
 */
export class UpdateRegistrationDto {
  @Expose()
  @ApiPropertyOptional({
    description: 'Category ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4')
  categoryId?: string;

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

  @Expose()
  @ApiPropertyOptional({
    description: 'Registration status',
    enum: RegistrationStatus,
    example: RegistrationStatus.APPROVED,
  })
  @IsOptional()
  @IsEnum(RegistrationStatus)
  status?: RegistrationStatus;
}
