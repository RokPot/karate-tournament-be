import { ValueTransformer } from 'typeorm';

/**
 * Numeric Transformer
 * Transforms PostgreSQL numeric type (which returns strings) to JavaScript numbers.
 * 
 * PostgreSQL's numeric/decimal types return as strings in JavaScript to preserve precision.
 * This transformer converts them to numbers when reading from the database.
 */
export const numericTransformer: ValueTransformer = {
  to: (value: number | null | undefined): number | null => {
    // When writing to database, pass through as-is
    return value ?? null;
  },
  from: (value: string | number | null | undefined): number | null => {
    // When reading from database, convert string to number
    if (value == null || value === '') {
      return null;
    }
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  },
};
