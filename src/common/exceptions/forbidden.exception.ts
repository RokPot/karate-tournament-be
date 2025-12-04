import { HttpStatus } from '@nestjs/common';

import { BaseException, type IBaseException } from '~common/exceptions/base.exception';

export class ForbiddenException extends BaseException {
  constructor(message?: string, input?: IBaseException | string) {
    super(
      message ?? 'Bad Request',
      typeof input === 'string'
        ? { code: input, httpStatus: HttpStatus.FORBIDDEN, level: 'debug' }
        : { code: 'forbidden', httpStatus: HttpStatus.FORBIDDEN, level: 'debug', ...input },
    );
  }
}
