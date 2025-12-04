import { registerDecorator, type ValidationOptions, type ValidationArguments } from 'class-validator';

import { type IPaginationOrder } from '../pagination.types';

export function IsPaginationOrder<T extends Record<string, string | number>>(
  enumConstraint: T,
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return function (object: object, propertyName: string | symbol) {
    registerDecorator({
      name: 'validatePaginationOrder',
      target: object.constructor,
      propertyName: propertyName.toString(),
      constraints: [enumConstraint],
      options: validationOptions,
      validator: {
        validate(value: IPaginationOrder<any>[], args: ValidationArguments) {
          const [enumConstraint] = args.constraints;
          return (
            Array.isArray(value) &&
            value.every(
              (order) =>
                Object.keys(enumConstraint).includes(order.property) && ['asc', 'desc'].includes(order.direction),
            )
          );
        },
      },
    });
  };
}
