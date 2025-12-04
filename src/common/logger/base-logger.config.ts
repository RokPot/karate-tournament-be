import { LogLevel } from '@nestjs/common';
import { Expose } from 'class-transformer';
import { IsEnum } from 'class-validator';

/**
 * Extends BaseLogLevel
 */
export enum BaseLogLevelEnum {
  'none' = 'none',
  'fatal' = 'fatal',
  'error' = 'error',
  'warn' = 'warn',
  'log' = 'log',
  'debug' = 'debug',
  'verbose' = 'verbose',
  'info' = 'info',
}

export class BaseLoggerConfig {
  /**
   * Default log level
   *  logs the selected severity and above
   */
  @Expose()
  @IsEnum(BaseLogLevelEnum)
  level?: LogLevel = 'log';
}

export interface IBaseLoggerConfig extends BaseLoggerConfig {}
