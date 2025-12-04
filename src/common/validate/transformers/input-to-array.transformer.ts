import { Transform } from 'class-transformer';

function transformInputToArrayFn(
  options: {
    transformer?: (value: string) => any;
    separator?: string;
    unique?: boolean;
  } = {},
) {
  const transformerFn = options.transformer || String;
  const separator = options.separator || ',';
  const unique = options.unique;

  return (payload: { value: any }): any[] | undefined => {
    let value = payload.value;

    if (typeof value === 'string') {
      if (value === '') {
        return undefined;
      }
      value = value.split(separator || ',').map((element) => element.trim());
    } else if (!Array.isArray(value)) {
      /**
       * Transformations should return the original value if the transformation is not possible
       */
      return value;
    }

    value = value.map((e: any) => (transformerFn ? transformerFn(e) : e));

    if (unique) {
      value = [...new Set(value)];
    }

    return value;
  };
}

export function TransformInputToArray(options?: Parameters<typeof transformInputToArrayFn>[0]): PropertyDecorator {
  return Transform(transformInputToArrayFn(options));
}
