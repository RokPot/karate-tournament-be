import { HttpStatus } from '@nestjs/common';

import { BaseException, type IBaseException } from '~common/exceptions/base.exception';

export class InternalServerErrorException extends BaseException {
  constructor(message?: string, input?: IBaseException | string) {
    super(
      message ?? 'Internal Server Error',
      typeof input === 'string'
        ? { code: input, httpStatus: HttpStatus.INTERNAL_SERVER_ERROR }
        : { code: 'internal-server-error', httpStatus: HttpStatus.INTERNAL_SERVER_ERROR, ...input },
    );
  }
}
