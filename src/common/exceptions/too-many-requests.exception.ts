import { HttpStatus } from '@nestjs/common';

import { BaseException, type IBaseException } from '~common/exceptions/base.exception';

export class TooManyRequestsException extends BaseException {
  constructor(message?: string, input?: IBaseException | string) {
    super(
      message ?? 'Too Many Requests',
      typeof input === 'string'
        ? { code: input, httpStatus: HttpStatus.TOO_MANY_REQUESTS, level: 'debug' }
        : { code: 'too-many-requests', httpStatus: HttpStatus.TOO_MANY_REQUESTS, level: 'debug', ...input },
    );
  }
}
