import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsOptional, IsUUID } from 'class-validator';

/**
 * Query DTO for GET /tournaments/:id/fees.
 */
export class TournamentFeesQueryDto {
  @Expose()
  @ApiPropertyOptional({
    description:
      'When set, return only this athlete’s individual fee and the teams they belong to. Omit for the full tournament bill.',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4')
  userId?: string;

  @Expose()
  @ApiPropertyOptional({
    description:
      'When set, return fees for this registration submit only (the Club and contact form). Combine with userId to further limit to one athlete.',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4')
  submissionId?: string;
}
