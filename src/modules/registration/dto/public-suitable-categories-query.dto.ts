import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsUUID, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';

import { BeltLevel, Gender } from '~common/enums';
import { ApiDateTimeProperty } from '~common/swagger/api-date.decorators';
import { IsDateOfBirth } from '~common/validate';

/**
 * Query DTO for GET public/suitable-categories.
 * Filters tournament categories by weight, date of birth, belt, and optionally gender without a user account.
 */
export class PublicSuitableCategoriesQueryDto {
  @Expose()
  @ApiProperty({
    description: 'Tournament ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4')
  tournamentId!: string;

  @Expose()
  @ApiProperty({ description: 'Weight in kg', example: 65, minimum: 0 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  weight!: number;

  @Expose()
  @ApiProperty({ description: 'Belt level', enum: BeltLevel, example: BeltLevel.KYU_7 })
  @IsEnum(BeltLevel)
  beltLevel!: BeltLevel;

  @Expose()
  @ApiDateTimeProperty({
    description: 'Date of birth',
    example: '2018-02-02T00:00:00.000Z',
  })
  @IsDateOfBirth()
  dateOfBirth!: string;

  @Expose()
  @ApiPropertyOptional({
    description: 'Gender (omit to exclude categories with a gender restriction)',
    enum: Gender,
    example: Gender.MALE,
  })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;
}
