import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

import { IPagination, IPaginationOrder } from '../pagination.types';

export class PaginationDto<T> implements IPagination<T> {
  /**
   * 1-indexed page number to begin from
   */
  @Expose()
  @IsNumber()
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
   * Cursor for next set of items
   */
  @Expose()
  @IsString()
  @IsOptional()
  readonly nextCursor?: string;

  /**
   * Items per response
   */
  @Expose()
  @IsNumber()
  readonly limit!: number;

  /**
   * Items
   */
  @ApiProperty({ description: 'Items' })
  @ValidateNested({ each: true })
  @Expose()
  readonly items!: T[];

  /**
   * Total available items
   */
  @Expose()
  @IsNumber()
  readonly totalItems!: number;

  /**
   * List of order definitions
   */
  @ApiPropertyOptional({ type: Object, isArray: true })
  @Expose()
  @IsArray()
  @IsOptional()
  readonly order?: IPaginationOrder<any>[];

  constructor(data: IPagination<any>) {
    return Object.assign(this, data);
  }

  static fromDomain<
    D extends Record<string, any> = Record<string, any>,
    T extends Record<string, any> = Record<string, any>,
  >(data: IPagination<D>, itemMapper?: (item: D) => T): PaginationDto<T> {
    return new PaginationDto<T>({
      page: data.page,
      cursor: data.cursor,
      nextCursor: data.nextCursor,
      limit: data.limit,
      items: itemMapper ? data.items.map(itemMapper) : data.items,
      order: data.order,
      totalItems: data.totalItems,
    });
  }
}
