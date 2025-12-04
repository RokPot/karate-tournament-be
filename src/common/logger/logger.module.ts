import { Global, Module } from '@nestjs/common';

import { BaseLoggerService } from './base-logger.service';
import { LoggerService } from './logger.service';

@Global()
@Module({
  providers: [LoggerService, { provide: BaseLoggerService, useClass: LoggerService }],
  exports: [BaseLoggerService, LoggerService],
})
export class LoggerModule {}
