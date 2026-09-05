import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';

import { TournamentStatus } from '~common/enums';

/**
 * Query DTO for GET /tournaments.
 */
export class TournamentListQueryDto {
  @Expose()
  @ApiPropertyOptional({
    description: 'Filter by review or lifecycle status',
    enum: TournamentStatus,
    example: TournamentStatus.APPROVED,
  })
  @IsOptional()
  @IsEnum(TournamentStatus)
  status?: TournamentStatus;
}
