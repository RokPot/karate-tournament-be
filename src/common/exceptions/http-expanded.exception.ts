import { type HttpException, HttpStatus } from '@nestjs/common';

import { BaseException } from '~common/exceptions/base.exception';
import type { BaseLogLevel } from '~common/logger';

import { type IErrorResponse } from './interfaces/error-response.interface';

export const HttpResponseMap: Record<HttpStatus, [BaseLogLevel, string]> = {
  // 1xx
  [HttpStatus.CONTINUE]: ['verbose', 'Continue'],
  [HttpStatus.SWITCHING_PROTOCOLS]: ['verbose', 'Switching Protocols'],
  [HttpStatus.PROCESSING]: ['verbose', 'Processing'],
  [HttpStatus.EARLYHINTS]: ['verbose', 'Early Hints'],
  // 2xx
  [HttpStatus.OK]: ['verbose', 'OK'],
  [HttpStatus.CREATED]: ['verbose', 'Created'],
  [HttpStatus.ACCEPTED]: ['verbose', 'Accepted'],
  [HttpStatus.NON_AUTHORITATIVE_INFORMATION]: ['verbose', 'Non-Authoritative Information'],
  [HttpStatus.NO_CONTENT]: ['verbose', 'No Content'],
  [HttpStatus.RESET_CONTENT]: ['verbose', 'Reset Content'],
  [HttpStatus.PARTIAL_CONTENT]: ['verbose', 'Partial Content'],
  // 3xx
  [HttpStatus.AMBIGUOUS]: ['verbose', 'Multiple Choices'],
  [HttpStatus.MOVED_PERMANENTLY]: ['log', 'Moved Permanently'],
  [HttpStatus.FOUND]: ['verbose', 'Found'],
  [HttpStatus.SEE_OTHER]: ['verbose', 'See Other'],
  [HttpStatus.NOT_MODIFIED]: ['verbose', 'Not Modified'],
  [HttpStatus.TEMPORARY_REDIRECT]: ['verbose', 'Temporary Redirect'],
  [HttpStatus.PERMANENT_REDIRECT]: ['verbose', 'Permanent Redirect'],
  // 4xx
  [HttpStatus.BAD_REQUEST]: ['warn', 'Bad request'],
  [HttpStatus.UNAUTHORIZED]: ['debug', 'Unauthorized'],
  [HttpStatus.PAYMENT_REQUIRED]: ['warn', 'Payment Required'],
  [HttpStatus.FORBIDDEN]: ['debug', 'Forbidden'],
  [HttpStatus.NOT_FOUND]: ['debug', 'Not Found'],
  [HttpStatus.METHOD_NOT_ALLOWED]: ['warn', 'Method Not Allowed'],
  [HttpStatus.NOT_ACCEPTABLE]: ['warn', 'Not Acceptable'],
  [HttpStatus.PROXY_AUTHENTICATION_REQUIRED]: ['warn', 'Proxy Authentication Required'],
  [HttpStatus.REQUEST_TIMEOUT]: ['error', 'Request Timeout'],
  [HttpStatus.CONFLICT]: ['log', 'Conflict'],
  [HttpStatus.GONE]: ['log', 'Gone'],
  [HttpStatus.LENGTH_REQUIRED]: ['warn', 'Length Required'],
  [HttpStatus.PRECONDITION_FAILED]: ['warn', 'Precondition Failed'],
  [HttpStatus.PAYLOAD_TOO_LARGE]: ['warn', 'Payload Too Large'],
  [HttpStatus.URI_TOO_LONG]: ['warn', 'URI Too Long'],
  [HttpStatus.UNSUPPORTED_MEDIA_TYPE]: ['warn', 'Unsupported Media Type'],
  [HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE]: ['warn', 'Range Not Satisfiable'],
  [HttpStatus.EXPECTATION_FAILED]: ['warn', 'Expectation Failed'],
  [HttpStatus.I_AM_A_TEAPOT]: ['verbose', "I'm a teapot"],
  [HttpStatus.MISDIRECTED]: ['warn', 'Misdirected'],
  [HttpStatus.UNPROCESSABLE_ENTITY]: ['warn', 'Unprocessable Entity'],
  [HttpStatus.FAILED_DEPENDENCY]: ['warn', 'Failed Dependency'],
  [HttpStatus.PRECONDITION_REQUIRED]: ['warn', 'Precondition Required'],
  [HttpStatus.TOO_MANY_REQUESTS]: ['warn', 'Too Many Requests'],
  // 5xx
  [HttpStatus.INTERNAL_SERVER_ERROR]: ['error', 'Internal Server warn'],
  [HttpStatus.NOT_IMPLEMENTED]: ['error', 'Not Implemented'],
  [HttpStatus.BAD_GATEWAY]: ['error', 'Bad Gateway'],
  [HttpStatus.SERVICE_UNAVAILABLE]: ['error', 'Service Unavailable'],
  [HttpStatus.GATEWAY_TIMEOUT]: ['error', 'Gateway Timeout'],
  [HttpStatus.HTTP_VERSION_NOT_SUPPORTED]: ['warn', 'HTTP Version Not Supported'],
};

export class HttpExpandedException extends BaseException {
  constructor(public readonly httpException: HttpException) {
    const status = httpException.getStatus();
    const [level, message] = HttpResponseMap[status as HttpStatus] ?? ['error', undefined];
    super(message || httpException.message, {
      cause: httpException,
      httpStatus: status,
      code: `http-${status}`,
      level,
    });
  }

  toPublic(): IErrorResponse {
    return {
      status: 'error',
      code: this.code,
      message: this.message,
    };
  }
}
