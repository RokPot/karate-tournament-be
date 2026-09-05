import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Optional body for POST /tournaments/:id/resubmit.
 */
export class ResubmitTournamentDto {
  @Expose()
  @ApiPropertyOptional({
    description: 'Note for the resubmission, stored as reviewNote',
    example: 'Venue and schedule updated',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
