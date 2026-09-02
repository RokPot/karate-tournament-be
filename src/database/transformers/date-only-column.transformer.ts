import { type ValueTransformer } from 'typeorm';

import { formatDateOnly, parseDateOfBirth } from '~common/utils/date-only.utils';

/**
 * Maps PostgreSQL `date` columns (returned as YYYY-MM-DD strings by node-pg) to local calendar Dates.
 */
export const dateOnlyColumnTransformer: ValueTransformer = {
  to(value: Date | string | null | undefined): string | null {
    if (value == null) {
      return null;
    }
    const date = value instanceof Date ? value : parseDateOfBirth(value);
    return formatDateOnly(date);
  },
  from(value: string | Date | null | undefined): Date | null {
    if (value == null || value === '') {
      return null;
    }
    if (value instanceof Date) {
      return value;
    }
    return parseDateOfBirth(value);
  },
};
