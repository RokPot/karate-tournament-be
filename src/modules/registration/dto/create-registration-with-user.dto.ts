import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsEmail, IsString, IsUUID, IsOptional, IsNumber, IsEnum, Min, Max, MaxLength } from 'class-validator';

import { Gender, BeltLevel } from '~common/enums';

/**
 * Create Registration With User DTO
 * Data transfer object for creating a registration with user information (public endpoint).
 */
export class CreateRegistrationWithUserDto {
  // User fields (lite version)
  @Expose()
  @ApiProperty({
    description: 'User email address (used to find or create user)',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  email!: string;

  @Expose()
  @ApiProperty({
    description: 'First name',
    example: 'John',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  firstName!: string;

  @Expose()
  @ApiProperty({
    description: 'Last name',
    example: 'Doe',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  lastName!: string;

  @Expose()
  @ApiPropertyOptional({
    description: 'Weight in kg',
    example: 75.5,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  weight?: number;

  @Expose()
  @ApiPropertyOptional({
    description: 'Age in years (used to calculate birthDate)',
    example: 25,
    minimum: 0,
    maximum: 150,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(150)
  age?: number;

  @Expose()
  @ApiPropertyOptional({
    description: 'Gender',
    enum: Gender,
    example: Gender.MALE,
  })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @Expose()
  @ApiPropertyOptional({
    description: 'Belt level',
    enum: BeltLevel,
    example: BeltLevel.BLACK,
  })
  @IsOptional()
  @IsEnum(BeltLevel)
  beltLevel?: BeltLevel;

  // Registration fields
  @Expose()
  @ApiProperty({
    description: 'Tournament ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4')
  tournamentId!: string;

  @Expose()
  @ApiProperty({
    description: 'Category ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4')
  categoryId!: string;

  @Expose()
  @ApiPropertyOptional({
    description: 'Club ID (optional - can be set later)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4')
  clubId?: string;

  @Expose()
  @ApiPropertyOptional({
    description: 'Final weight in kg',
    example: 75.5,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  finalWeight?: number;
}
