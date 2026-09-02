import { Transform } from 'class-transformer';

/**
 * Normalizes JSON bodies where arrays were sent as objects (e.g. { "0": {}, "1": {} }).
 */
export function TransformObjectToArray(): PropertyDecorator {
  return Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value;
    }
    if (value && typeof value === 'object') {
      return Object.keys(value)
        .sort((a, b) => Number(a) - Number(b))
        .map((key) => value[key]);
    }
    return value;
  });
}
