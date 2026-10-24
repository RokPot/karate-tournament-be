import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

import { TransformInputToBoolean } from '~common/validate';

/**
 * Query DTO for the bracket PDF endpoints.
 */
export class BracketPdfQueryDto {
  @Expose()
  @ApiPropertyOptional({
    description:
      'When true, categories that have no schedule yet are generated first (needs at least 2 competitors; tournament must be in_progress). When false or omitted, only existing schedules are printed.',
    example: false,
  })
  @IsOptional()
  @TransformInputToBoolean()
  @IsBoolean()
  generateMissing?: boolean;

  @Expose()
  @ApiPropertyOptional({
    description:
      'Blank handwritten score cells per match, plus one Sum cell, on the final and third-place match of kata and kata-team categories. Other disciplines never print score cells. 0 hides the score row. Defaults to 5.',
    example: 5,
    minimum: 0,
    maximum: 8,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(8)
  scoreCount?: number;
}
