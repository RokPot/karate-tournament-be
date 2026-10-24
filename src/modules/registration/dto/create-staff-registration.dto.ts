import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsEmail, IsEnum, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

import { BeltLevel, Gender } from '~common/enums';
import { ApiDateTimeProperty } from '~common/swagger/api-date.decorators';
import { IsDateOfBirth } from '~common/validate';

/**
 * Staff adds one participant to one individual category.
 * Admin or owning club owner. Team categories are rejected.
 */
export class CreateStaffRegistrationDto {
  @Expose()
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID('4')
  tournamentId!: string;

  @Expose()
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID('4')
  categoryId!: string;

  @Expose()
  @ApiProperty({ example: 'John', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  firstName!: string;

  @Expose()
  @ApiProperty({ example: 'Doe', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  lastName!: string;

  @Expose()
  @ApiProperty({ enum: Gender, example: Gender.MALE })
  @IsEnum(Gender)
  gender!: Gender;

  @Expose()
  @ApiDateTimeProperty({ description: 'Date of birth', example: '2018-02-02T00:00:00.000Z' })
  @IsDateOfBirth()
  dateOfBirth!: string;

  @Expose()
  @ApiProperty({ enum: BeltLevel, example: BeltLevel.DAN_1 })
  @IsEnum(BeltLevel)
  beltLevel!: BeltLevel;

  @Expose()
  @ApiPropertyOptional({ description: 'Weight in kg', example: 75.5, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  weight?: number;

  @Expose()
  @ApiPropertyOptional({ description: 'Final (weigh-in) weight in kg', example: 75.5, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  finalWeight?: number;

  @Expose()
  @ApiPropertyOptional({
    description: 'Participant club. Part of the participant identity when no email is given.',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4')
  clubId?: string;

  @Expose()
  @ApiPropertyOptional({
    description:
      'When set, the user with this email is found or created. Otherwise club + name + date of birth identify the person.',
    example: 'john.doe@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;
}
