import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

import type { TournamentFeeCalculation } from '../calculate-tournament-fees';

import { TournamentFeeScheduleDto } from './tournament-fee-schedule.dto';

export class TournamentFeeParticipantDto {
  @Expose()
  @ApiProperty({
    description: 'Participant user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId!: string;

  @Expose()
  @ApiProperty({
    description: 'Participant display name',
    example: 'Jane Doe',
  })
  name!: string;

  @Expose()
  @ApiPropertyOptional({
    description: 'Club ID from the participant’s individual registrations',
    example: '123e4567-e89b-12d3-a456-426614174000',
    nullable: true,
  })
  clubId!: string | null;

  @Expose()
  @ApiProperty({
    description: 'Number of individual (non-team) categories this participant is registered in',
    example: 2,
  })
  categoryCount!: number;

  @Expose()
  @ApiProperty({
    description: 'Individual category fee for this participant in euros',
    example: 20,
  })
  amount!: number;

  constructor(data: TournamentFeeParticipantDto) {
    Object.assign(this, data);
  }
}

export class TournamentFeeTeamLineDto {
  @Expose()
  @ApiProperty({
    description: 'Team ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  teamId!: string;

  @Expose()
  @ApiProperty({
    description: 'Team category ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  categoryId!: string;

  @Expose()
  @ApiProperty({
    description: 'Team category name',
    example: 'Kumite Team Senior',
  })
  categoryName!: string;

  @Expose()
  @ApiPropertyOptional({
    description: 'Club ID on the team',
    example: '123e4567-e89b-12d3-a456-426614174000',
    nullable: true,
  })
  clubId!: string | null;

  @Expose()
  @ApiProperty({
    description: 'Team fee in euros',
    example: 30,
  })
  amount!: number;

  constructor(data: TournamentFeeTeamLineDto) {
    Object.assign(this, data);
  }
}

export class TournamentFeeClubLineDto {
  @Expose()
  @ApiPropertyOptional({
    description: 'Club ID. Null when registrations or teams have no club.',
    example: '123e4567-e89b-12d3-a456-426614174000',
    nullable: true,
  })
  clubId!: string | null;

  @Expose()
  @ApiProperty({
    description: 'Sum of individual participant fees for this club in euros',
    example: 40,
  })
  participantTotal!: number;

  @Expose()
  @ApiProperty({
    description: 'Sum of team fees for this club in euros',
    example: 30,
  })
  teamTotal!: number;

  @Expose()
  @ApiProperty({
    description: 'Participant and team fees combined in euros',
    example: 70,
  })
  total!: number;

  constructor(data: TournamentFeeClubLineDto) {
    Object.assign(this, data);
  }
}

export class TournamentFeesCalculationDto {
  @Expose()
  @Type(() => TournamentFeeScheduleDto)
  @ApiProperty({
    description: 'Fee schedule used for this calculation',
    type: TournamentFeeScheduleDto,
  })
  fees!: TournamentFeeScheduleDto;

  @Expose()
  @Type(() => TournamentFeeParticipantDto)
  @ApiProperty({
    description: 'Individual participant fees. Team categories are excluded from the count.',
    type: [TournamentFeeParticipantDto],
  })
  participants!: TournamentFeeParticipantDto[];

  @Expose()
  @Type(() => TournamentFeeTeamLineDto)
  @ApiProperty({
    description: 'Team fees. Each qualifying team is charged once.',
    type: [TournamentFeeTeamLineDto],
  })
  teams!: TournamentFeeTeamLineDto[];

  @Expose()
  @Type(() => TournamentFeeClubLineDto)
  @ApiProperty({
    description: 'Fees rolled up by club. Null clubId is kept as its own row.',
    type: [TournamentFeeClubLineDto],
  })
  clubs!: TournamentFeeClubLineDto[];

  @Expose()
  @ApiProperty({
    description: 'Tournament (or user-scoped) total in euros',
    example: 90,
  })
  total!: number;

  constructor(data: ITournamentFeesCalculationDto) {
    Object.assign(this, data);
  }

  static fromCalculation(calculation: TournamentFeeCalculation): TournamentFeesCalculationDto {
    return new TournamentFeesCalculationDto({
      fees: new TournamentFeeScheduleDto(calculation.fees),
      participants: calculation.participants.map((row) => new TournamentFeeParticipantDto(row)),
      teams: calculation.teams.map((row) => new TournamentFeeTeamLineDto(row)),
      clubs: calculation.clubs.map((row) => new TournamentFeeClubLineDto(row)),
      total: calculation.total,
    });
  }
}

export interface ITournamentFeesCalculationDto extends TournamentFeesCalculationDto {}
