import { registerDecorator, type ValidationOptions } from 'class-validator';

import { isDateOfBirthString } from '~common/utils/date-only.utils';

export function IsDateOfBirth(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isDateOfBirth',
      target: object.constructor,
      propertyName,
      options: {
        message: `${propertyName} must be a valid date (e.g. 2018-02-02T00:00:00.000Z, YYYY-MM-DD, or 7.7.2000)`,
        ...validationOptions,
      },
      validator: {
        validate(value: unknown) {
          return isDateOfBirthString(value);
        },
      },
    });
  };
}
