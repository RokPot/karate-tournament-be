import { HttpStatus } from '@nestjs/common';

import type { IBaseException } from '~common/exceptions/base.exception';
import { BaseException } from '~common/exceptions/base.exception';

export class ConflictException extends BaseException {
  constructor(message?: string, input?: IBaseException | string) {
    super(
      message ?? 'Conflict',
      typeof input === 'string'
        ? { code: input, httpStatus: HttpStatus.CONFLICT, level: 'debug' }
        : { code: 'conflict', httpStatus: HttpStatus.CONFLICT, level: 'debug', ...input },
    );
  }
}
