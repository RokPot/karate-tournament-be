import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

import { BeltLevel, Gender } from '~common/enums';
import { ApiDateTimePropertyOptional } from '~common/swagger/api-date.decorators';
import { IsDateOfBirth } from '~common/validate';

/**
 * Staff edit of the participant behind a registration. All fields optional.
 * Identity fields are written on the user; finalWeight only on this registration.
 */
export class UpdateRegistrationIdentityDto {
  @Expose()
  @ApiPropertyOptional({ example: 'John', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @Expose()
  @ApiPropertyOptional({ example: 'Doe', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @Expose()
  @ApiPropertyOptional({ enum: Gender, example: Gender.MALE })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @Expose()
  @ApiDateTimePropertyOptional({ description: 'Date of birth', example: '2018-02-02T00:00:00.000Z', nullable: false })
  @IsOptional()
  @IsDateOfBirth()
  dateOfBirth?: string;

  @Expose()
  @ApiPropertyOptional({ description: 'Weight in kg', example: 75.5, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  weight?: number;

  @Expose()
  @ApiPropertyOptional({ enum: BeltLevel, example: BeltLevel.DAN_1 })
  @IsOptional()
  @IsEnum(BeltLevel)
  beltLevel?: BeltLevel;

  @Expose()
  @ApiPropertyOptional({
    description: 'Final (weigh-in) weight in kg for this registration',
    example: 75.5,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  finalWeight?: number;
}
