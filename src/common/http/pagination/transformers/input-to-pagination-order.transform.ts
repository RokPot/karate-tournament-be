import { Transform } from 'class-transformer';

import { type IPaginationOrder } from '../pagination.types';

export function transformInputToPaginationOrder(key: string | symbol = 'order') {
  return (input: {
    value: string | string[];
    obj?: Record<typeof key, Record<string, any>>;
  }): IPaginationOrder<any>[] | undefined => {
    if (!input.value) return undefined;

    if (typeof input.value === 'string' || Array.isArray(input.value)) {
      /**
       * Collect all items of `order=`, split by comma\
       *  - ?order=field1,-field2,field3&order=field4
       */
      return (Array.isArray(input.value) ? input.value : [input.value])
        .map((i) => i.split(','))
        .flat()
        .map((x: string) => x.trim())
        .map((i) => {
          return { property: i.replace(/^[-+]/, ''), direction: i.startsWith('-') ? 'desc' : 'asc' };
        });
    }

    /**
     * Collect ?order[field]=desc|asc
     *  - this could be non-deterministic
     */
    if (input.obj && key in input.obj) {
      return Object.entries(input.obj[key]).reduce((acc, [property, direction]) => {
        if (['asc', 'desc'].includes(direction)) {
          acc.push({ property, direction });
        }
        return acc;
      }, [] as IPaginationOrder<any>[]);
    }

    return undefined;
  };
}

export function TransformInputToPaginationOrder(): PropertyDecorator {
  return (target: any, propertyName: string | symbol) => {
    Transform(transformInputToPaginationOrder(propertyName))(target, propertyName);
  };
}
