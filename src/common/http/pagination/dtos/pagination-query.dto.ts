import { Expose, Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

import { getConfig } from '~common/config';

import { PaginationConfig } from '../pagination.config';

const paginationConfig = getConfig(PaginationConfig);

export class PaginationBaseQueryDto {
  /**
   * 1-indexed page number to begin from
   */
  @Expose()
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  readonly page?: number;

  /**
   * ID of item to start after
   */
  @Expose()
  @IsString()
  @IsOptional()
  readonly cursor?: string;

  /**
   * Items per response
   */
  @Expose()
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  readonly limit: number = paginationConfig.limitDefault;
}

export abstract class PaginationQueryDto extends PaginationBaseQueryDto {
  /**
   * Items per response
   */
  @Expose()
  @Min(paginationConfig.limitMin)
  @Max(paginationConfig.limitMax)
  readonly limit: number = paginationConfig.limitDefault;
}
