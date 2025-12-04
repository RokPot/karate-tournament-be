import 'reflect-metadata';

// hook: instrumentation

import './common/logger/sentry/sentry.instrument';

import { NestFactory } from '@nestjs/core';
import { raw } from 'express';

import { getConfig } from '~common/config';
import { HttpConfig } from '~common/http/http.config';
import { LoggerService } from '~common/logger';

import { AppModule } from '~app.module';
import { requestPipes } from '~app.pipes';

const logger = new LoggerService('Bootstrap');

async function bootstrap() {
  logger.log('Starting application');

  const app = await NestFactory.create(AppModule, {
    logger,
    // Expose raw body on requests for Stripe webhook signature verification
    //rawBody: true,
  });

  /**
   * Enable onApplicationShutdown lifecycle hook for graceful shutdown
   * @see https://docs.nestjs.com/fundamentals/lifecycle-events
   */
  app.enableShutdownHooks();

  /**
   * Load global pipes for
   *  - logging, metrics
   *  - error handling
   */
  requestPipes(app);

  // Stripe webhook must receive the raw body for signature verification
  app.use('/webhooks/stripe/events', raw({ type: 'application/json' }));

  const httpConfig = getConfig(HttpConfig);
  await app.listen(httpConfig.port, httpConfig.host);
}
bootstrap().catch((e) => {
  logger.error(e);
  throw e;
});
