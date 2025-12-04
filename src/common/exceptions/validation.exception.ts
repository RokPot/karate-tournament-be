import { HttpStatus } from '@nestjs/common';
import { type ValidationError } from 'class-validator';

import { ValidationErrors } from '~common/validate';

import { BaseException, type IBaseException } from './base.exception';
import { type IValidationExceptionResponse } from './interfaces/validation-exception-response.interface';
import { validationErrorsToValidationExceptionErrors } from './transformers/validation-exception-response.transform';

export class ValidationException extends BaseException {
  code = 'validation-exception';
  httpStatus = HttpStatus.BAD_REQUEST;
  errors: ValidationError[];
  target: object | undefined;

  constructor(message: string | undefined, options: IBaseException & { target?: object; errors: ValidationError[] }) {
    if (!options.errors || options.errors.length === 0) {
      // programmatic error
      throw new Error('ValidationException requires at least one ValidationError');
    }
    const target = options?.target || options.errors[0].target;
    super(message ?? `Validation failed`, { cause: options?.cause });
    this.errors = options.errors;
    this.target = target;
  }

  static fromValidationErrorArray(errors: ValidationError[]) {
    return new ValidationException(undefined, { errors });
  }

  static fromValidationErrors(errors: ValidationErrors) {
    return new ValidationException(undefined, {
      errors: errors.errors,
      cause: errors,
    });
  }

  public toValidationErrors(): ValidationErrors {
    return new ValidationErrors(this.errors);
  }

  public toPublic(): IValidationExceptionResponse {
    return {
      status: 'error',
      code: this.code,
      message: this.message,
      errors: validationErrorsToValidationExceptionErrors(this.errors),
    };
  }

  public toConsole() {
    return this.toValidationErrors().toConsole();
  }
}
