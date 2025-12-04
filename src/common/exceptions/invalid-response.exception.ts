import { HttpStatus } from '@nestjs/common';

import { BaseException, type IBaseException } from '~common/exceptions/base.exception';

export class InvalidResponseException extends BaseException {
  constructor(message?: string, input?: IBaseException | string) {
    super(
      message ?? 'Invalid response',
      typeof input === 'string'
        ? { code: input, httpStatus: HttpStatus.INTERNAL_SERVER_ERROR }
        : { code: 'invalid-response', httpStatus: HttpStatus.INTERNAL_SERVER_ERROR, ...input },
    );
  }
}
