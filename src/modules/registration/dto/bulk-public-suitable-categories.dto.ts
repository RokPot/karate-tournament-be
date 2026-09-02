import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsUUID, ValidateNested } from 'class-validator';

import { PublicParticipantProfileDto } from './public-participant-profile.dto';

/**
 * Bulk request for POST public/suitable-categories.
 */
export class BulkPublicSuitableCategoriesDto {
  @Expose()
  @ApiProperty({
    description: 'Tournament ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4')
  tournamentId!: string;

  @Expose()
  @ApiProperty({
    description: 'Participants to evaluate for suitable categories',
    type: [PublicParticipantProfileDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PublicParticipantProfileDto)
  participants!: PublicParticipantProfileDto[];
}
