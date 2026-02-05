import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsNumber,
  IsEmail,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator';

import { Gender, BeltLevel, UserRole } from '~common/enums';

/**
 * DTO for creating a user without Auth0 (e.g. club member).
 * auth0Id is set to a placeholder and can be linked to Auth0 later.
 */
export class CreateUserWithoutAuth0Dto {
  @Expose()
  @ApiProperty({
    description: 'Club ID to assign the user to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  clubId!: string;

  @Expose()
  @ApiProperty({
    description: 'Roles to assign (e.g. [UserRole.CLUB_MEMBER])',
    enum: UserRole,
    isArray: true,
    example: [UserRole.CLUB_MEMBER],
  })
  @IsArray()
  @IsEnum(UserRole, { each: true })
  roles!: UserRole[];

  @Expose()
  @ApiProperty({ description: 'First name', example: 'John', minLength: 2, maxLength: 100 })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstName!: string;

  @Expose()
  @ApiProperty({ description: 'Last name', example: 'Doe', minLength: 2, maxLength: 100 })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  lastName!: string;

  @Expose()
  @ApiPropertyOptional({ description: 'Email', example: 'member@example.com', maxLength: 255 })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string | null;

  @Expose()
  @ApiProperty({ description: 'Gender', enum: Gender })
  @IsEnum(Gender)
  gender!: Gender;

  @Expose()
  @ApiProperty({
    description: 'Birth date',
    example: '1990-01-01',
    type: String,
    format: 'date',
  })
  @IsString()
  birthDate!: string;

  @Expose()
  @ApiPropertyOptional({ description: 'Weight in kg', example: 75.5, minimum: 0, maximum: 999.99 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999.99)
  weight?: number | null;

  @Expose()
  @ApiProperty({ description: 'Belt level', enum: BeltLevel })
  @IsEnum(BeltLevel)
  beltLevel!: BeltLevel;
}
