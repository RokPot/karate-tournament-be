import { ValidationPipe } from '@nestjs/common';
import type { ValidationError } from 'class-validator';

import { ValidationErrors } from './validation-errors';

/**
 * Request agnostic validation pipe
 *  - Validate request DTO with class-validator
 *  - Transform request DTO with class-transformer
 *  - use same options as `plainToValidatedInstance`
 */
export function getValidationPipe(exceptionFactory?: (e: ValidationError[]) => Error) {
  return new ValidationPipe({
    transform: true,
    transformOptions: {
      exposeDefaultValues: true,
      exposeUnsetFields: false,
      strategy: 'excludeAll',
    },
    whitelist: true, // strip non-whitelisted
    forbidNonWhitelisted: true, // throw on non-whitelisted
    exceptionFactory:
      exceptionFactory ??
      ((fieldErrors) => {
        return new ValidationErrors(fieldErrors);
      }),
  });
}
