import { Transform } from 'class-transformer';

function transformSingleValue(value: any): number | undefined {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value !== 'string') {
    /**
     * Transformations should return the original value if the transformation is not possible
     */
    return value;
  }

  if (value.trim() === '') {
    return undefined;
  }

  const parsedNumber = Number(value);

  if (!isNaN(parsedNumber) && isFinite(parsedNumber)) {
    return parsedNumber;
  }

  return undefined;
}

function transformInputToNumberFn(options: { each?: boolean } = {}) {
  const { each = false } = options;

  return (payload: { value: any }): number | number[] | undefined => {
    const value = payload.value;

    if (each && Array.isArray(value)) {
      const transformed = value.map((item) => transformSingleValue(item));
      const numbers = transformed.filter((item): item is number => item !== undefined);
      return numbers.length > 0 ? numbers : undefined;
    }

    return transformSingleValue(value);
  };
}

export function TransformInputToNumber(options?: Parameters<typeof transformInputToNumberFn>[0]): PropertyDecorator {
  return Transform(transformInputToNumberFn(options));
}
