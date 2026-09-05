import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

import { RegistrationStatus } from '~common/enums';

/**
 * Query DTO for GET /registrations/me.
 */
export class MyRegistrationsQueryDto {
  @Expose()
  @ApiPropertyOptional({
    description: 'Filter by tournament ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4')
  tournamentId?: string;

  @Expose()
  @ApiPropertyOptional({
    description: 'Filter by registration status',
    enum: RegistrationStatus,
    example: RegistrationStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(RegistrationStatus)
  status?: RegistrationStatus;
}
