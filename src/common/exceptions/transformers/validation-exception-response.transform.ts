import type { ValidationError } from 'class-validator';

import type {
  IValidationExceptionField,
  IValidationExceptionResponse,
} from '../interfaces/validation-exception-response.interface';

export function validationErrorsToValidationExceptionErrors(
  errors: ValidationError[],
): IValidationExceptionResponse['errors'] {
  const fields: Record<string, IValidationExceptionField[]> = {};
  const queue: { error: ValidationError; prefix?: string }[] = [...errors.map((error) => ({ error }))];
  while (queue.length > 0) {
    const { error, prefix } = queue.pop()!;
    const property = prefix ? `${prefix}.${error.property}` : error.property;
    if (error.constraints) {
      fields[property] = Object.entries(error.constraints).map(([k, v]) => ({
        type: k,
        message: v as string,
      }));
    }
    if (error.children) {
      queue.push(
        ...error.children.map((child) => ({
          error: child,
          prefix: property,
        })),
      );
    }
  }
  return fields;
}
