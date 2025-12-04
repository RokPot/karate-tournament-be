// src/main.worker.ts
import { NestFactory } from '@nestjs/core';

import { LoggerService } from '~common/logger';

import { AppModule } from '~app.module';

const logger = new LoggerService('Worker');

async function bootstrap() {
  logger.log('Starting worker');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger,
  });

  app.enableShutdownHooks();

  logger.log('Worker bootstrap complete');
}
bootstrap().catch((error) => {
  logger.error('Worker bootstrap failed:', error);
  process.exit(1);
});
