import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsArray, ArrayMinSize, ValidateNested } from 'class-validator';

import { BulkParticipantRegistrationDto } from './bulk-participant-registration.dto';
import { PublicParticipantProfileDto } from './public-participant-profile.dto';
import { TransformObjectToArray } from './transformers/object-to-array.transform';

/**
 * Participant profile and registrations for bulk public registration.
 * Extends {@link PublicParticipantProfileDto} — no email field.
 */
export class BulkParticipantDto extends PublicParticipantProfileDto {
  @Expose()
  @ApiProperty({
    description: 'Registrations for this participant',
    type: [BulkParticipantRegistrationDto],
  })
  @TransformObjectToArray()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BulkParticipantRegistrationDto)
  registrations!: BulkParticipantRegistrationDto[];
}
