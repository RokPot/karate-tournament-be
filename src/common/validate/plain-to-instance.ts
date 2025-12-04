import { type ClassConstructor, type ClassTransformOptions, plainToInstance } from 'class-transformer';
import { validateSync, type ValidatorOptions } from 'class-validator';

import { ValidationErrors } from './validation-errors';

/**
 * Converts a data object to a class-validated instance
 *  using strict options and default values
 */
export function plainToValidatedInstance<T extends object, F = T>(
  cls: ClassConstructor<T>,
  data: F,
  transformOptions?: ClassTransformOptions,
  validateOptions?: ValidatorOptions,
): T {
  const instance =
    data instanceof cls
      ? data
      : plainToInstance(cls, data, {
          // Use default values for properties that are not present in the data object
          //  (eg. `page: number = appConstants.pagination.page.default`)
          exposeDefaultValues: true,
          // Omit "undefined" plain properties if false
          exposeUnsetFields: false,
          // Only include properties with `@Expose()` decorator set in plain object
          //  this is to prevent data leaking to the client
          strategy: 'excludeAll',
          ...(transformOptions ? transformOptions : {}),
        });

  const issues = validateSync(instance, {
    // Remove non-decorated properties from the object
    whitelist: true,
    // Throw error if non-whitelisted properties are present
    forbidNonWhitelisted: true,
    ...(validateOptions ? validateOptions : {}),
  });

  if (issues?.length > 0) {
    throw new ValidationErrors(issues);
  }

  return instance;
}

/**
 * Converts a data object to a class-validated instance provider
 *  using strict options and default values
 */
export function plainToValidatedInstanceProvider<T extends object>(
  cls: ClassConstructor<T>,
  data: T,
  transformOptions?: ClassTransformOptions,
  validateOptions?: ValidatorOptions,
) {
  return {
    provide: cls,
    useFactory: () => plainToValidatedInstance(cls, data, transformOptions, validateOptions),
  };
}
