import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

import { Gender, BeltLevel, UserRole } from '~common/enums';
import { ClubResponseDto } from '../../club/dto/club-response.dto';

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
    description: 'Gender',
    enum: Gender,
    example: Gender.MALE,
    nullable: true,
  })
  gender!: Gender | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'Birth date',
    example: '1990-01-01',
    nullable: true,
  })
  birthDate!: Date | null;

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
    example: BeltLevel.BLACK,
    nullable: true,
  })
  beltLevel!: BeltLevel | null;

  @Expose()
  @ApiProperty({
    description: 'User roles',
    enum: UserRole,
    isArray: true,
    example: [UserRole.COMPETITOR],
  })
  roles!: UserRole[];

  @Expose()
  @ApiPropertyOptional({
    description: 'Club information',
    type: ClubResponseDto,
    nullable: true,
  })
  club!: ClubResponseDto | null;

  @Expose()
  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt!: Date;

  @Expose()
  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt!: Date;
}

