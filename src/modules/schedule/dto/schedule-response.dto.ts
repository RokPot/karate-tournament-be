import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

import { ScheduleKind } from '~common/enums';

import { Schedule } from '../schedule.entity';

import { CompetitorRefDto } from './competitor-ref.dto';
import { GameResponseDto } from './game-response.dto';

export class ScheduleResponseDto {
  @Expose()
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string;

  @Expose()
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  tournamentId!: string;

  @Expose()
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  categoryId!: string;

  @Expose()
  @ApiProperty({ enum: ScheduleKind, example: ScheduleKind.SINGLE_ELIMINATION })
  kind!: ScheduleKind;

  @Expose()
  @ApiProperty({ description: 'Number of real participants (not padded)', example: 5 })
  size!: number;

  @Expose()
  @Type(() => GameResponseDto)
  @ApiProperty({ type: [GameResponseDto] })
  games!: GameResponseDto[];

  @Expose()
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: string;

  @Expose()
  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: string;

  constructor(data: ScheduleResponseDto) {
    Object.assign(this, data);
  }

  static fromDomain(schedule: Schedule, competitors: Map<string, CompetitorRefDto>): ScheduleResponseDto {
    return new ScheduleResponseDto({
      id: schedule.id,
      tournamentId: schedule.tournamentId,
      categoryId: schedule.categoryId,
      kind: schedule.kind,
      size: schedule.size,
      games: (schedule.games ?? []).map((game) => GameResponseDto.fromDomain(game, competitors)),
      createdAt: schedule.createdAt instanceof Date ? schedule.createdAt.toISOString() : String(schedule.createdAt),
      updatedAt: schedule.updatedAt instanceof Date ? schedule.updatedAt.toISOString() : String(schedule.updatedAt),
    });
  }
}
