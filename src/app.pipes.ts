import { type INestApplication } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { mw as RequestIpMiddleware } from 'request-ip';

import { ValidationException } from '~common/exceptions';
import { HttpExceptionsFilter } from '~common/exceptions/filters/http-exceptions.filter';
import { useCors } from '~common/http/cors/cors.middleware';
import { useClassSerializerInterceptor } from '~common/http/interceptors/class-serializer.interceptor';
import { useTimeoutInterceptor } from '~common/http/interceptors/timeout.interceptor';
import { setupOpenApi } from '~common/http/openapi/openapi.middleware';
import { ExpressLoggerMiddleware } from '~common/logger/express-logger.middleware';
import { getValidationPipe } from '~common/validate';
import { useUserSyncInterceptor } from '~modules/user/user-sync.interceptor';

/**
 * Standard request pipeline
 */
export function requestPipes(app: INestApplication): void {
  app.use(RequestIpMiddleware());

  // hook: before-http

  useCors(app);

  // hook: http

  app.use(ExpressLoggerMiddleware);

  useClassSerializerInterceptor(app);

  const instance = app.getHttpAdapter().getInstance();
  instance.disable('x-powered-by'); // disable express header
  // instance.disable('etag'); // disable etag

  app.useGlobalFilters(
    /**
     * Request Agnostic Exception Handler
     *  - log exceptions
     *  - convert exceptions to POJO response
     */
    new HttpExceptionsFilter(app.get(HttpAdapterHost)),

    // More specific filters should go here
  );

  app.useGlobalPipes(
    /**
     * Request Agnostic Transform/Validate
     *  - same options as `plainToValidatedInstance`
     */
    getValidationPipe(ValidationException.fromValidationErrorArray),
  );

  useTimeoutInterceptor(app);

  // User sync interceptor - creates User entity from Auth0 payload on first authenticated request
  // This must run after Auth0Guard validation (which happens in guards, before interceptors)
  useUserSyncInterceptor(app);

  // hook: after-interceptors
  setupOpenApi(app);
}
