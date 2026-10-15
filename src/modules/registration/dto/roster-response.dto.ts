import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

import { BeltLevel, Gender } from '~common/enums';
import { ApiDateTimeProperty } from '~common/swagger/api-date.decorators';

import { TournamentFeesCalculationDto } from '../../tournament/dto/tournament-fees-calculation.dto';

export class RosterRegistrationItemDto {
  @Expose()
  @ApiProperty({ description: 'Registration ID' })
  id!: string;

  @Expose()
  @ApiProperty({ description: 'Category ID' })
  categoryId!: string;
}

export class RosterParticipantDto {
  @Expose()
  @ApiProperty({ description: 'Participant user ID' })
  userId!: string;

  @Expose()
  @ApiProperty({ description: 'First name' })
  firstName!: string;

  @Expose()
  @ApiProperty({ description: 'Last name' })
  lastName!: string;

  @Expose()
  @ApiPropertyOptional({ description: 'Weight in kg', nullable: true })
  weight!: number | null;

  @Expose()
  @ApiDateTimeProperty({ description: 'Date of birth' })
  dateOfBirth!: string;

  @Expose()
  @ApiPropertyOptional({ enum: Gender, nullable: true })
  gender!: Gender | null;

  @Expose()
  @ApiPropertyOptional({ enum: BeltLevel, nullable: true })
  beltLevel!: BeltLevel | null;

  @Expose()
  @Type(() => RosterRegistrationItemDto)
  @ApiProperty({ type: [RosterRegistrationItemDto], description: 'Individual (non-team) category registrations' })
  registrations!: RosterRegistrationItemDto[];
}

export class RosterTeamItemDto {
  @Expose()
  @ApiProperty({ description: 'Team ID' })
  id!: string;

  @Expose()
  @ApiProperty({ description: 'Team display name' })
  name!: string;

  @Expose()
  @ApiProperty({ description: 'Team category ID' })
  categoryId!: string;

  @Expose()
  @ApiProperty({ type: [Number], description: 'Starter indexes into participants[]' })
  starters!: number[];

  @Expose()
  @ApiPropertyOptional({ type: [Number], description: 'Reserve indexes into participants[]' })
  reserves?: number[];
}

export class RosterResponseDto {
  @Expose()
  @ApiProperty({ description: 'Coach email' })
  email!: string;

  @Expose()
  @ApiProperty({ description: 'Coach first name' })
  firstName!: string;

  @Expose()
  @ApiProperty({ description: 'Coach last name' })
  lastName!: string;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  clubName!: string | null;

  @Expose()
  @ApiPropertyOptional({ nullable: true })
  clubId!: string | null;

  @Expose()
  @ApiProperty({ description: 'Tournament ID' })
  tournamentId!: string;

  @Expose()
  @ApiDateTimeProperty({ description: 'When the roster was last saved' })
  updatedAt!: string;

  @Expose()
  @Type(() => RosterParticipantDto)
  @ApiProperty({ type: [RosterParticipantDto] })
  participants!: RosterParticipantDto[];

  @Expose()
  @Type(() => RosterTeamItemDto)
  @ApiProperty({ type: [RosterTeamItemDto] })
  teams!: RosterTeamItemDto[];

  @Expose()
  @Type(() => TournamentFeesCalculationDto)
  @ApiPropertyOptional({ type: TournamentFeesCalculationDto, description: 'Current bill for this roster' })
  fees?: TournamentFeesCalculationDto;

  constructor(data: RosterResponseDto) {
    Object.assign(this, data);
  }
}
