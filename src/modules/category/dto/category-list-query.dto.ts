import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

import { TransformInputToBoolean } from '~common/validate';

/**
 * Query DTO for GET /categories.
 */
export class CategoryListQueryDto {
  @Expose()
  @ApiPropertyOptional({
    description: 'Filter by club ID (admin). Club staff may only pass their own club.',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4')
  clubId?: string;

  @Expose()
  @ApiPropertyOptional({
    description: 'When true, list only global categories (clubId null). Admin only. Mutually exclusive with includeGlobal.',
    example: true,
  })
  @IsOptional()
  @TransformInputToBoolean()
  @IsBoolean()
  global?: boolean;

  @Expose()
  @ApiPropertyOptional({
    description:
      'When true and clubId is set, list global categories (clubId null) and that club\'s categories. Club staff may only pass their own clubId. Mutually exclusive with global=true.',
    example: true,
  })
  @IsOptional()
  @TransformInputToBoolean()
  @IsBoolean()
  includeGlobal?: boolean;
}
