import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

import { CompetitorKind } from '~common/enums';

import { Match } from '../match.entity';

import { CompetitorRefDto } from './competitor-ref.dto';

export class MatchResponseDto {
  @Expose()
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string;

  @Expose()
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  gameId!: string;

  @Expose()
  @ApiProperty({ enum: CompetitorKind, example: CompetitorKind.REGISTRATION })
  competitorKind!: CompetitorKind;

  @Expose()
  @ApiPropertyOptional({ nullable: true, example: '123e4567-e89b-12d3-a456-426614174000' })
  competitorAId!: string | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true, example: '123e4567-e89b-12d3-a456-426614174000' })
  competitorBId!: string | null;

  @Expose()
  @Type(() => CompetitorRefDto)
  @ApiPropertyOptional({ type: CompetitorRefDto, nullable: true })
  competitorA!: CompetitorRefDto | null;

  @Expose()
  @Type(() => CompetitorRefDto)
  @ApiPropertyOptional({ type: CompetitorRefDto, nullable: true })
  competitorB!: CompetitorRefDto | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  winnerId!: string | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true, type: String, format: 'date-time' })
  startTime!: string | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true, type: String, format: 'date-time' })
  endTime!: string | null;

  constructor(data: MatchResponseDto) {
    Object.assign(this, data);
  }

  static fromDomain(match: Match, competitors: Map<string, CompetitorRefDto>): MatchResponseDto {
    return new MatchResponseDto({
      id: match.id,
      gameId: match.gameId,
      competitorKind: match.competitorKind,
      competitorAId: match.competitorAId,
      competitorBId: match.competitorBId,
      competitorA: match.competitorAId ? (competitors.get(match.competitorAId) ?? null) : null,
      competitorB: match.competitorBId ? (competitors.get(match.competitorBId) ?? null) : null,
      winnerId: match.winnerId,
      startTime: match.startTime instanceof Date ? match.startTime.toISOString() : (match.startTime ?? null),
      endTime: match.endTime instanceof Date ? match.endTime.toISOString() : (match.endTime ?? null),
    });
  }
}
