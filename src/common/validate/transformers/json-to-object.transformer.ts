import { Transform } from 'class-transformer';

import { ValidationException } from '~common/exceptions';

export function TransformJsonToObject() {
  return Transform(({ value }) => {
    try {
      return JSON.parse(value);
    } catch (e) {
      throw new ValidationException('Invalid JSON format', { errors: [] });
    }
  });
}
