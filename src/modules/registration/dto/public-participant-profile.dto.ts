import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsString, IsNumber, IsEnum, IsOptional, Min, MaxLength } from 'class-validator';

import { Gender, BeltLevel } from '~common/enums';
import { ApiDateTimeProperty } from '~common/swagger/api-date.decorators';
import { IsDateOfBirth } from '~common/validate';

/**
 * Public bulk participant profile (no email).
 * Used for bulk registration and bulk suitable-categories lookups.
 */
export class PublicParticipantProfileDto {
  @Expose()
  @ApiProperty({ description: 'First name', example: 'John', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  firstName!: string;

  @Expose()
  @ApiProperty({ description: 'Last name', example: 'Doe', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  lastName!: string;

  @Expose()
  @ApiProperty({ description: 'Weight in kg', example: 65, minimum: 0 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  weight!: number;

  @Expose()
  @ApiDateTimeProperty({
    description: 'Date of birth',
    example: '2018-02-02T00:00:00.000Z',
  })
  @IsDateOfBirth()
  dateOfBirth!: string;

  @Expose()
  @ApiPropertyOptional({
    description: 'Gender (required when matching categories with a gender restriction)',
    enum: Gender,
    example: Gender.MALE,
  })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @Expose()
  @ApiPropertyOptional({ description: 'Belt level', enum: BeltLevel, example: BeltLevel.KYU_10 })
  @IsOptional()
  @IsEnum(BeltLevel)
  beltLevel?: BeltLevel;
}
