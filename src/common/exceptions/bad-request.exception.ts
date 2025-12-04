import { HttpStatus } from '@nestjs/common';

import { BaseException, type IBaseException } from '~common/exceptions/base.exception';

export class BadRequestException extends BaseException {
  constructor(message?: string, input?: IBaseException | string) {
    super(
      message ?? 'Bad Request',
      typeof input === 'string'
        ? { code: input, httpStatus: HttpStatus.BAD_REQUEST, level: 'debug' }
        : { code: 'bad-request', httpStatus: HttpStatus.BAD_REQUEST, level: 'debug', ...input },
    );
  }
}
