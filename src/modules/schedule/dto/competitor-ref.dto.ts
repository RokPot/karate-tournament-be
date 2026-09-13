import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

import { CompetitorKind } from '~common/enums';

export class CompetitorRefDto {
  @Expose()
  @ApiProperty({
    description: 'Registration or team ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @Expose()
  @ApiProperty({ enum: CompetitorKind, example: CompetitorKind.REGISTRATION })
  kind!: CompetitorKind;

  @Expose()
  @ApiPropertyOptional({ description: 'Display name', nullable: true, example: 'Jane Doe' })
  displayName!: string | null;

  constructor(data: CompetitorRefDto) {
    Object.assign(this, data);
  }
}
