import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

import { BeltLevel, Gender, UserRole } from '~common/enums';
import { ApiDateTimeProperty, ApiDateTimePropertyOptional } from '~common/swagger/api-date.decorators';
import { formatDateOfBirthForResponse } from '~common/utils/date-only.utils';

import { ClubResponseDto } from '../../club/dto/club-response.dto';
import { User } from '../user.entity';

/**
 * User Response DTO
 * Data transfer object for user responses.
 */
export class UserResponseDto {
  @Expose()
  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @Expose()
  @ApiProperty({
    description: 'Auth0 user ID',
    example: 'auth0|123456789',
  })
  auth0Id!: string;

  @Expose()
  @ApiPropertyOptional({
    description: 'Club ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    nullable: true,
  })
  clubId!: string | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'First name',
    example: 'John',
    nullable: true,
  })
  firstName!: string | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'Last name',
    example: 'Doe',
    nullable: true,
  })
  lastName!: string | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'Email (for display and future Auth0 linking)',
    example: 'member@example.com',
    nullable: true,
  })
  email!: string | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'Gender',
    enum: Gender,
    example: Gender.MALE,
    nullable: true,
  })
  gender!: Gender | null;

  @Expose()
  @ApiDateTimePropertyOptional({
    description: 'Date of birth',
    example: '1990-01-01T00:00:00.000Z',
    nullable: true,
  })
  dateOfBirth!: string | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'Weight in kg',
    example: 75.5,
    nullable: true,
  })
  weight!: number | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'Belt level',
    enum: BeltLevel,
    example: BeltLevel.DAN_1,
    nullable: true,
  })
  beltLevel!: BeltLevel | null;

  @Expose()
  @ApiProperty({
    description: 'User roles',
    enum: UserRole,
    isArray: true,
    example: [UserRole.CLUB_MEMBER],
  })
  roles!: UserRole[];

  @Expose()
  @Type(() => ClubResponseDto)
  @ApiPropertyOptional({
    description: 'Club information',
    type: ClubResponseDto,
    nullable: true,
  })
  club!: ClubResponseDto | null;

  @Expose()
  @ApiDateTimeProperty({ description: 'Creation timestamp' })
  createdAt!: string;

  @Expose()
  @ApiDateTimeProperty({ description: 'Last update timestamp' })
  updatedAt!: string;

  constructor(data: IUserResponseDto) {
    Object.assign(this, data);
  }

  /**
   * Creates a UserResponseDto instance from a User entity
   */
  static fromDomain(user: User): UserResponseDto {
    return new UserResponseDto({
      id: user.id,
      auth0Id: user.auth0Id,
      clubId: user.clubId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      gender: user.gender,
      dateOfBirth: formatDateOfBirthForResponse(user.dateOfBirth),
      weight: user.weight != null && typeof user.weight === 'string' ? parseFloat(user.weight) : user.weight,
      beltLevel: user.beltLevel,
      roles: user.roles,
      club: user.club ? ClubResponseDto.fromDomain(user.club) : null,
      createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : String(user.createdAt || ''),
      updatedAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : String(user.updatedAt || ''),
    });
  }
}

export interface IUserResponseDto extends UserResponseDto {}
