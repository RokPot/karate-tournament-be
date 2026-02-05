import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsString, IsOptional, IsEnum, IsNumber, IsArray, MaxLength, Min, Max, IsEmail } from 'class-validator';

import { Gender, BeltLevel, UserRole } from '~common/enums';

/**
 * Update User DTO
 * Data transfer object for updating user profile.
 */
export class UpdateUserDto {
  @Expose()
  @ApiPropertyOptional({
    description: 'First name',
    example: 'John',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @Expose()
  @ApiPropertyOptional({
    description: 'Last name',
    example: 'Doe',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @Expose()
  @ApiPropertyOptional({
    description: 'Email',
    example: 'user@example.com',
    maxLength: 255,
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

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
    description: 'Birth date',
    example: '1990-01-01',
    type: String,
    format: 'date',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  birthDate?: string | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'Weight in kg',
    example: 75.5,
    minimum: 0,
    maximum: 999.99,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999.99)
  weight?: number;

  @Expose()
  @ApiPropertyOptional({
    description: 'Belt level',
    enum: BeltLevel,
    example: BeltLevel.BLACK,
  })
  @IsOptional()
  @IsEnum(BeltLevel)
  beltLevel?: BeltLevel;

  @Expose()
  @ApiPropertyOptional({
    description: 'User roles',
    enum: UserRole,
    isArray: true,
    example: [UserRole.CLUB_MEMBER, UserRole.CLUB_COACH],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(UserRole, { each: true })
  roles?: UserRole[];

  @Expose()
  @ApiPropertyOptional({
    description: 'Club ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  clubId?: string;
}
