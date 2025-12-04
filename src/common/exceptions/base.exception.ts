import { HttpStatus } from '@nestjs/common';

import type { BaseLogLevel } from '~common/logger';

import type { IErrorResponse } from './interfaces/error-response.interface';

export interface IBaseException extends ErrorOptions {
  /**
   * Level used in logging
   */
  level?: BaseLogLevel;

  /**
   * Alphanumeric code of the error type
   */
  code?: string;

  /**
   * HTTP status code
   */
  httpStatus?: HttpStatus;
}

/**
 * Base class of expected failures
 */
export class BaseException extends Error implements IBaseException {
  public readonly level: BaseLogLevel;
  public readonly code: string;
  public readonly httpStatus: HttpStatus;
  constructor(message: string, options: IBaseException) {
    super(message, { cause: options.cause });
    this.code = options.code ?? 'exception';
    this.level = options.level ?? 'error';
    this.httpStatus = options.httpStatus ?? HttpStatus.INTERNAL_SERVER_ERROR;
  }

  /**
   * User facing error response
   */
  public toPublic(): IErrorResponse {
    return {
      status: 'error',
      code: this.code,
      message: this.message,
    };
  }
}
