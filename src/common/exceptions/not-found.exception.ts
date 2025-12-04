import { HttpStatus } from '@nestjs/common';

import { BaseException, type IBaseException } from '~common/exceptions/base.exception';

export class NotFoundException extends BaseException {
  constructor(message?: string, input?: IBaseException | string) {
    super(
      message ?? 'Not Found',
      typeof input === 'string'
        ? { code: input, httpStatus: HttpStatus.NOT_FOUND, level: 'debug' }
        : { code: 'not-found', httpStatus: HttpStatus.NOT_FOUND, level: 'debug', ...input },
    );
  }
}
