import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsArray, IsOptional, IsUUID, ValidateNested } from 'class-validator';

import { BulkParticipantRegistrationDto } from './bulk-participant-registration.dto';
import { PublicParticipantProfileDto } from './public-participant-profile.dto';
import { TransformObjectToArray } from './transformers/object-to-array.transform';

/**
 * Participant profile and registrations for bulk public registration.
 * Extends {@link PublicParticipantProfileDto} — no email field.
 * registrations may be empty when the person is only on teams.
 */
export class BulkParticipantDto extends PublicParticipantProfileDto {
  @Expose()
  @ApiPropertyOptional({
    description: 'Existing participant user ID (continue-roster PUT)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4')
  userId?: string;

  @Expose()
  @ApiPropertyOptional({
    description:
      'Individual category registrations for this participant. May be empty when the person is only on teams.',
    type: [BulkParticipantRegistrationDto],
  })
  @IsOptional()
  @TransformObjectToArray()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkParticipantRegistrationDto)
  registrations?: BulkParticipantRegistrationDto[];
}
