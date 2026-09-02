import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
import { ApiDateOnlyProperty } from '~common/swagger/api-date.decorators';
import { IsDateOfBirth } from '~common/validate';

/** Allowed roles when adding a member to a club */
const CLUB_MEMBER_ROLES: UserRole[] = [UserRole.CLUB_OWNER, UserRole.CLUB_MEMBER, UserRole.CLUB_COACH];

/**
 * DTO for adding a member (user) to a club.
 * Creates a new user in the DB with a placeholder auth0Id and assigns them to the club.
 */
export class AddMemberDto {
  @Expose()
  @ApiProperty({
    description: 'Role to assign to the member',
    enum: [UserRole.CLUB_OWNER, UserRole.CLUB_MEMBER, UserRole.CLUB_COACH],
    example: UserRole.CLUB_MEMBER,
  })
  @IsEnum(UserRole)
  @IsIn(CLUB_MEMBER_ROLES)
  role!: UserRole;

  @Expose()
  @ApiProperty({
    description: 'First name',
    example: 'John',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstName!: string;

  @Expose()
  @ApiProperty({
    description: 'Last name',
    example: 'Doe',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  lastName!: string;

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
  @ApiProperty({
    description: 'Gender',
    enum: Gender,
    example: Gender.MALE,
  })
  @IsEnum(Gender)
  gender!: Gender;

  @Expose()
  @ApiDateOnlyProperty({ description: 'Date of birth', example: '7.7.2000' })
  @IsDateOfBirth()
  dateOfBirth!: string;

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
  @ApiProperty({
    description: 'Belt level',
    enum: BeltLevel,
    example: BeltLevel.DAN_1,
  })
  @IsEnum(BeltLevel)
  beltLevel!: BeltLevel;
}
