import { Catch, ArgumentsHost, HttpException, ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { HttpAdapterHost } from '@nestjs/core';

import type { BaseLogLevel } from '~common/logger';
import { LoggerService } from '~common/logger';
import { ValidationErrors } from '~common/validate';

import { BaseException } from '../base.exception';
import { HttpExpandedException } from '../http-expanded.exception';
import { IErrorResponse } from '../interfaces/error-response.interface';
import { ValidationException } from '../validation.exception';

export const logger = new LoggerService('HttpException');

/**
 * Catch-all exception filter
 *  - convert exceptions to a standard response
 *  - last step before returning to the client
 */
@Catch()
export class HttpExceptionsFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: Error, host: ArgumentsHost) {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    let httpStatus: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    let responseBody: IErrorResponse;
    let level: BaseLogLevel;

    if (exception instanceof HttpException) {
      const expandedException = new HttpExpandedException(exception);
      httpStatus = expandedException.httpStatus;
      responseBody = expandedException.toPublic();
      level = expandedException.level;
    } else if (exception instanceof ValidationErrors) {
      const expandedException = ValidationException.fromValidationErrors(exception);
      httpStatus = expandedException.httpStatus;
      responseBody = expandedException.toPublic();
      level = expandedException.level;
    } else if (exception instanceof BaseException) {
      httpStatus = exception.httpStatus;
      responseBody = exception.toPublic();
      level = exception.level;
    } else {
      level = 'error';
      // do not leak exception details
      responseBody = {
        status: 'error',
        code: 'uncaught-exception',
        message: 'Uncaught Exception',
      };
    }

    logger.send({
      level,
      message: responseBody.message,
      error: exception,
      code: responseBody.code,
    });

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
