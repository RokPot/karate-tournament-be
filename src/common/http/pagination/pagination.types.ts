export type IPaginationOrderDirection = 'asc' | 'desc';

export interface IPaginationOrder<T> {
  property: T;
  direction: IPaginationOrderDirection;
}

export interface IPagination<T> {
  /**
   * 1-indexed page number to begin from
   */
  page?: number;

  /**
   * Cursor for the current set of items
   */
  cursor?: string | number;

  /**
   * Cursor for next set of items
   */
  nextCursor?: string | number;

  /**
   * Items per response
   */
  limit: number;

  /**
   * List of items
   */
  items: T[];

  /**
   * Total number of items
   */
  totalItems?: number;

  /**
   * List of order definitions
   */
  order?: IPaginationOrder<T>[];
}

export interface IPaginationQuery<F, O> {
  /**
   * 1-indexed page number to begin from
   */
  page?: number;

  /**
   * ID of item to start after
   */
  cursor?: any;

  /**
   * Items per response
   */
  limit: number;

  /**
   * List of order definitions
   */
  order?: IPaginationOrder<O>[];

  /**
   * Filters
   */
  filter?: F;
}
