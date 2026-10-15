import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

import { ApiDateTimePropertyOptional } from '~common/swagger/api-date.decorators';

export class RosterLookupResponseDto {
  @Expose()
  @ApiProperty({ description: 'Whether a roster exists for this coach + club in the tournament' })
  found!: boolean;

  @Expose()
  @ApiDateTimePropertyOptional({
    description: 'When the roster was last saved (present when found is true)',
    nullable: true,
  })
  updatedAt?: string | null;

  constructor(data: RosterLookupResponseDto) {
    Object.assign(this, data);
  }
}
