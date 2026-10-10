import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import { BeltLevel, Gender, UserRole } from '~common/enums';
import { ApiDateOnlyPropertyOptional } from '~common/swagger/api-date.decorators';
import { IsDateOfBirth } from '~common/validate';

/** Allowed roles when updating a club member */
const CLUB_MEMBER_ROLES: UserRole[] = [UserRole.CLUB_OWNER, UserRole.CLUB_MEMBER, UserRole.CLUB_COACH];

/**
 * DTO for updating a club member. All fields optional.
 */
export class UpdateMemberDto {
  @Expose()
  @ApiPropertyOptional({
    description: 'Role to assign to the member',
    enum: [UserRole.CLUB_OWNER, UserRole.CLUB_MEMBER, UserRole.CLUB_COACH],
    example: UserRole.CLUB_MEMBER,
  })
  @IsOptional()
  @IsEnum(UserRole)
  @IsIn(CLUB_MEMBER_ROLES)
  role?: UserRole;

  @Expose()
  @ApiPropertyOptional({
    description: 'First name',
    example: 'John',
    minLength: 2,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstName?: string;

  @Expose()
  @ApiPropertyOptional({
    description: 'Last name',
    example: 'Doe',
    minLength: 2,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  lastName?: string;

  @Expose()
  @ApiPropertyOptional({
    description: 'Email (for display and future Auth0 linking)',
    example: 'member@example.com',
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
  @ApiDateOnlyPropertyOptional({ description: 'Date of birth', example: '7.7.2000' })
  @IsOptional()
  @IsDateOfBirth()
  dateOfBirth?: string;

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
    example: BeltLevel.DAN_1,
  })
  @IsOptional()
  @IsEnum(BeltLevel)
  beltLevel?: BeltLevel;
}
