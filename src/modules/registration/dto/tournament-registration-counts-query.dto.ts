import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsUUID } from 'class-validator';

/**
 * Query DTO for GET /registrations/by-tournament/counts.
 */
export class TournamentRegistrationCountsQueryDto {
  @Expose()
  @ApiProperty({
    description: 'Tournament ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4')
  tournamentId!: string;
}
