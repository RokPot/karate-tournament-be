import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsString, IsOptional, MaxLength, IsEmail } from 'class-validator';

/**
 * Create Club DTO
 * Data transfer object for creating a new club.
 * Optional owner fields: when ownerEmail is provided, an invitation is created and inviteUrl is returned.
 */
export class CreateClubDto {
  @Expose()
  @ApiProperty({
    description: 'Club name',
    example: 'Tokyo Karate Club',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255)
  name!: string;

  @Expose()
  @ApiPropertyOptional({
    description: 'Club address',
    example: '123 Main Street, Tokyo, Japan',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @Expose()
  @ApiPropertyOptional({
    description: 'Club country',
    example: 'Japan',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @Expose()
  @ApiPropertyOptional({
    description: 'Club owner email; when provided, an invitation is created and inviteUrl returned',
    example: 'owner@example.com',
    maxLength: 255,
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  ownerEmail?: string;

  @Expose()
  @ApiPropertyOptional({
    description: 'Club owner first name',
    example: 'John',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  ownerFirstName?: string;

  @Expose()
  @ApiPropertyOptional({
    description: 'Club owner last name',
    example: 'Doe',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  ownerLastName?: string;
}

