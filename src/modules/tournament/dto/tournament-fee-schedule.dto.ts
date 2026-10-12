import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsNumber, IsOptional, Min } from 'class-validator';

import { Tournament } from '../tournament.entity';

/**
 * Per-tournament fee schedule in euros.
 * Individual amounts are totals for that band (3 or more stays at threeOrMoreCategories).
 * Team is charged once per team in a team category.
 */
export class TournamentFeeScheduleDto {
  @Expose()
  @ApiProperty({
    description: 'Total fee when a participant is registered in 1 individual category',
    example: 10,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  oneCategory!: number;

  @Expose()
  @ApiProperty({
    description: 'Total fee when a participant is registered in 2 individual categories',
    example: 20,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  twoCategories!: number;

  @Expose()
  @ApiProperty({
    description: 'Total fee when a participant is registered in 3 or more individual categories',
    example: 30,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  threeOrMoreCategories!: number;

  @Expose()
  @ApiProperty({
    description: 'Fee charged once per team in a team category',
    example: 30,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  team!: number;

  constructor(data: ITournamentFeeScheduleDto) {
    Object.assign(this, data);
  }

  static fromTournament(tournament: Tournament): TournamentFeeScheduleDto {
    return new TournamentFeeScheduleDto({
      oneCategory: tournament.feeOneCategory,
      twoCategories: tournament.feeTwoCategories,
      threeOrMoreCategories: tournament.feeThreeOrMoreCategories,
      team: tournament.feeTeam,
    });
  }
}

export interface ITournamentFeeScheduleDto extends TournamentFeeScheduleDto {}

/**
 * Partial fee schedule for tournament updates. Any field sent replaces that amount.
 */
export class UpdateTournamentFeeScheduleDto {
  @Expose()
  @ApiPropertyOptional({
    description: 'Total fee when a participant is registered in 1 individual category',
    example: 10,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  oneCategory?: number;

  @Expose()
  @ApiPropertyOptional({
    description: 'Total fee when a participant is registered in 2 individual categories',
    example: 20,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  twoCategories?: number;

  @Expose()
  @ApiPropertyOptional({
    description: 'Total fee when a participant is registered in 3 or more individual categories',
    example: 30,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  threeOrMoreCategories?: number;

  @Expose()
  @ApiPropertyOptional({
    description: 'Fee charged once per team in a team category',
    example: 30,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  team?: number;
}
