import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsUUID, IsNumber, IsEnum, IsOptional, Min, ValidateIf } from 'class-validator';

import { BeltLevel, Gender } from '~common/enums';
import { ApiDateTimeProperty } from '~common/swagger/api-date.decorators';
import { IsDateOfBirth, TransformInputToNumber } from '~common/validate';

/**
 * Query DTO for GET public/suitable-categories.
 * Filters tournament categories by date of birth, belt, optionally weight, and optionally gender without a user account.
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
  @ApiPropertyOptional({
    description: 'Weight in kg (omit when unknown; skipped for categories with no weight limits)',
    example: 65,
    minimum: 0,
  })
  @IsOptional()
  @ValidateIf((_o, v) => v != null)
  @TransformInputToNumber()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  weight?: number;

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
