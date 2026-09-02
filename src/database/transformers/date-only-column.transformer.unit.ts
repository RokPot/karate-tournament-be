import { describe, expect, it } from 'vitest';

import { parseDateOfBirth } from '~common/utils/date-only.utils';

import { dateOnlyColumnTransformer } from './date-only-column.transformer';

describe('dateOnlyColumnTransformer', () => {
  it('writes YYYY-MM-DD from a Date', () => {
    expect(dateOnlyColumnTransformer.to(parseDateOfBirth('2018-02-02'))).toBe('2018-02-02');
  });

  it('reads YYYY-MM-DD as a local calendar Date', () => {
    const date = dateOnlyColumnTransformer.from('2018-02-02');
    expect(date).toBeInstanceOf(Date);
    expect(date!.getFullYear()).toBe(2018);
    expect(date!.getMonth()).toBe(1);
    expect(date!.getDate()).toBe(2);
  });
});
