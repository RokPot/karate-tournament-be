import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsEmail,
  IsString,
  IsUUID,
  IsOptional,
  MaxLength,
  MinLength,
  IsArray,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';

import { BulkParticipantDto } from './bulk-participant.dto';
import { TransformObjectToArray } from './transformers/object-to-array.transform';

/**
 * Bulk public registration: coach info plus participants with nested registrations.
 */
export class BulkPublicRegistrationDto {
  @Expose()
  @ApiProperty({
    description: 'Coach email address (used to find or create coach user)',
    example: 'coach@club.com',
  })
  @IsEmail()
  email!: string;

  @Expose()
  @ApiProperty({ description: 'Coach first name', example: 'Jane', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  firstName!: string;

  @Expose()
  @ApiProperty({ description: 'Coach last name', example: 'Coach', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  lastName!: string;

  @Expose()
  @ApiPropertyOptional({
    name: 'clubName',
    description:
      'Club name (free text). If a matching club exists in the system, it is linked; otherwise registrations proceed without a club.',
    example: 'Dragon Karate Club',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  clubName?: string;

  @Expose()
  @ApiProperty({
    description: 'Tournament ID for all registrations in this request',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4')
  tournamentId!: string;

  @Expose()
  @ApiProperty({
    description: 'Participants to register',
    type: [BulkParticipantDto],
  })
  @TransformObjectToArray()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BulkParticipantDto)
  participants!: BulkParticipantDto[];
}
