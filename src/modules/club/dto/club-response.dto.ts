import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

import { Club } from '../club.entity';

/**
 * Club Response DTO
 * Data transfer object for club responses.
 */
export class ClubResponseDto {
  @Expose()
  @ApiProperty({
    description: 'Club ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @Expose()
  @ApiProperty({
    description: 'Club name',
    example: 'Tokyo Karate Club',
  })
  name!: string;

  @Expose()
  @ApiPropertyOptional({
    description: 'Club address',
    example: '123 Main Street, Tokyo, Japan',
    nullable: true,
  })
  address!: string | null;

  @Expose()
  @ApiPropertyOptional({
    description: 'Club country',
    example: 'Japan',
    nullable: true,
  })
  country!: string | null;

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

  constructor(data: IClubResponseDto) {
    Object.assign(this, data);
  }

  /**
   * Creates a ClubResponseDto instance from a Club entity
   */
  static fromDomain(club: Club): ClubResponseDto {
    return new ClubResponseDto({
      id: club.id,
      name: club.name,
      address: club.address,
      country: club.country,
      createdAt: club.createdAt,
      updatedAt: club.updatedAt,
    });
  }
}

export interface IClubResponseDto extends ClubResponseDto {}
