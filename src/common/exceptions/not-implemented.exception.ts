import { HttpStatus } from '@nestjs/common';

import { BaseException, type IBaseException } from '~common/exceptions/base.exception';

export class NotImplementedException extends BaseException {
  constructor(message?: string, input?: IBaseException | string) {
    super(
      message ?? 'Not Implemented',
      typeof input === 'string'
        ? { code: input, httpStatus: HttpStatus.NOT_IMPLEMENTED }
        : { code: 'not-implemented', httpStatus: HttpStatus.NOT_IMPLEMENTED, ...input },
    );
  }
}
