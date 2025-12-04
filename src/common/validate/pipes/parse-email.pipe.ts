import { HttpStatus, Injectable, Optional, PipeTransform } from '@nestjs/common';
import { ErrorHttpStatusCode, HttpErrorByCode } from '@nestjs/common/utils/http-error-by-code.util';
import { isNil } from '@nestjs/common/utils/shared.utils';
import { isEmail } from 'class-validator';

/**
 * @publicApi
 */
export interface ParseEmailPipeOptions {
  optional?: boolean;
  errorHttpStatusCode?: ErrorHttpStatusCode;
  exceptionFactory?: (error: string) => any;
}

/**
 * Parse email pipe
 * @example
 *  async endpoint(@Query('email', ParseEmailPipe) email: string)
 */
@Injectable()
export class ParseEmailPipe implements PipeTransform<string> {
  protected exceptionFactory: (error: string) => any;
  constructor(@Optional() protected readonly options?: ParseEmailPipeOptions) {
    const { exceptionFactory, errorHttpStatusCode = HttpStatus.BAD_REQUEST } = options || {};
    this.exceptionFactory = exceptionFactory || ((error) => new HttpErrorByCode[errorHttpStatusCode](error));
  }

  /**
   * Method that accesses and performs optional transformation on argument for
   * in-flight requests.
   *
   * @param value currently processed route argument
   */
  async transform(
    value: any,
    // contains metadata about the currently processed route argument
    // metadata: ArgumentMetadata
  ): Promise<string | undefined | null> {
    if (isNil(value) && this.options?.optional) {
      return value;
    }
    if (!value) {
      throw this.exceptionFactory('Validation failed (email is required)');
    }
    const email = value.toLowerCase().trim();
    if (!isEmail(email)) {
      throw this.exceptionFactory('Validation failed (email is expected)');
    }
    return email;
  }
}
