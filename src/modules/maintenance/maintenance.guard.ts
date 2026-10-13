import { timingSafeEqual } from 'crypto';

import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Request } from 'express';

import { MaintenanceConfig } from './maintenance.config';
import { MAINTENANCE_KEY_HEADER } from './maintenance.constants';

const secretsMatch = (provided: string, expected: string): boolean => {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  if (providedBuffer.length !== expectedBuffer.length) {
    timingSafeEqual(expectedBuffer, expectedBuffer);
    return false;
  }
  return timingSafeEqual(providedBuffer, expectedBuffer);
};

@Injectable()
export class MaintenanceGuard implements CanActivate {
  constructor(private readonly maintenanceConfig: MaintenanceConfig) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.maintenanceConfig.key;
    if (!expected) {
      throw new ForbiddenException();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const headerValue = request.header(MAINTENANCE_KEY_HEADER);
    const provided = Array.isArray(headerValue) ? headerValue[0] : headerValue;
    if (!provided || !secretsMatch(provided, expected)) {
      throw new ForbiddenException();
    }

    return true;
  }
}
