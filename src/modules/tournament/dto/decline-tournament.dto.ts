import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Optional body for POST /tournaments/:id/decline.
 */
export class DeclineTournamentDto {
  @Expose()
  @ApiPropertyOptional({
    description: 'Reason for declining, stored as reviewNote',
    example: 'Missing venue details',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}
