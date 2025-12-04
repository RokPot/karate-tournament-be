import { Transform } from 'class-transformer';

function transformInputToBooleanFn(payload: { value: any }): boolean | undefined {
  const { value } = payload;

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value === 1;
  }

  if (typeof value !== 'string') {
    /**
     * Transformations should return the original value if the transformation is not possible
     */
    return value;
  }

  if (['true', 't', 'yes', '1'].includes(value.toLowerCase())) {
    return true;
  }

  if (['false', 'f', 'no', '0'].includes(value.toLowerCase())) {
    return false;
  }

  return undefined;
}

export function TransformInputToBoolean(): PropertyDecorator {
  return Transform(transformInputToBooleanFn);
}
