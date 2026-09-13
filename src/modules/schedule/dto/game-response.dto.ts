import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

import { GameSlotKind, GameSlotOutcome, GameWinnerSide } from '~common/enums';

import { Game } from '../game.entity';

import { CompetitorRefDto } from './competitor-ref.dto';
import { MatchResponseDto } from './match-response.dto';

export class GameResponseDto {
  @Expose()
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string;

  @Expose()
  @ApiProperty({ example: 'r0-m0' })
  key!: string;

  @Expose()
  @ApiProperty({ example: false })
  isThirdPlace!: boolean;

  @Expose()
  @ApiProperty({ example: false })
  isBye!: boolean;

  @Expose()
  @ApiPropertyOptional({ enum: GameWinnerSide, nullable: true })
  winnerSide!: GameWinnerSide | null;

  @Expose()
  @ApiProperty({ enum: GameSlotKind })
  slotAKind!: GameSlotKind;

  @Expose()
  @ApiProperty({ enum: GameSlotKind })
  slotBKind!: GameSlotKind;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  slotACompetitorId!: string | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  slotBCompetitorId!: string | null;

  @Expose()
  @Type(() => CompetitorRefDto)
  @ApiPropertyOptional({ type: CompetitorRefDto, nullable: true })
  slotACompetitor!: CompetitorRefDto | null;

  @Expose()
  @Type(() => CompetitorRefDto)
  @ApiPropertyOptional({ type: CompetitorRefDto, nullable: true })
  slotBCompetitor!: CompetitorRefDto | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  slotAFromGameId!: string | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  slotBFromGameId!: string | null;

  @Expose()
  @ApiPropertyOptional({ enum: GameSlotOutcome, nullable: true })
  slotAOutcome!: GameSlotOutcome | null;

  @Expose()
  @ApiPropertyOptional({ enum: GameSlotOutcome, nullable: true })
  slotBOutcome!: GameSlotOutcome | null;

  @Expose()
  @Type(() => MatchResponseDto)
  @ApiProperty({ type: [MatchResponseDto] })
  matches!: MatchResponseDto[];

  constructor(data: GameResponseDto) {
    Object.assign(this, data);
  }

  static fromDomain(game: Game, competitors: Map<string, CompetitorRefDto>): GameResponseDto {
    return new GameResponseDto({
      id: game.id,
      key: game.key,
      isThirdPlace: game.isThirdPlace,
      isBye: game.isBye,
      winnerSide: game.winnerSide,
      slotAKind: game.slotAKind,
      slotBKind: game.slotBKind,
      slotACompetitorId: game.slotACompetitorId,
      slotBCompetitorId: game.slotBCompetitorId,
      slotACompetitor: game.slotACompetitorId ? (competitors.get(game.slotACompetitorId) ?? null) : null,
      slotBCompetitor: game.slotBCompetitorId ? (competitors.get(game.slotBCompetitorId) ?? null) : null,
      slotAFromGameId: game.slotAFromGameId,
      slotBFromGameId: game.slotBFromGameId,
      slotAOutcome: game.slotAOutcome,
      slotBOutcome: game.slotBOutcome,
      matches: (game.matches ?? []).map((match) => MatchResponseDto.fromDomain(match, competitors)),
    });
  }
}
