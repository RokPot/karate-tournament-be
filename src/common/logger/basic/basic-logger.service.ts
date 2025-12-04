import { Inject } from '@nestjs/common';
import { INQUIRER } from '@nestjs/core';
import { serializeError } from 'serialize-error';

import { getConfig } from '~common/config';

import { BaseLoggerService, BaseLogLevel, LogLevelOrder } from '../base-logger.service';
import { type ILog } from '../interfaces';
import { loggerConsoleFormatter } from '../logger.console-formatter';
import { loggerStore } from '../logger.store';

import { BasicLoggerConfig } from './basic-logger.config';

const basicLoggerConfig = getConfig(BasicLoggerConfig);

/**
 * Basic Logger service
 *  - instantiated once per module
 *  - synchronous/blocking if the underlying logger is synchronous
 *     in AWS ECS, setting logDriver to non-blocking fixes the issue
 *     in AWS Lambda, logging is always non-blocking
 *  - filter logs based on the context
 *
 * @example config
 *   contexts:
 *     Exceptions: warn
 *     UserService: debug
 *     Bootstrap: log
 */
export class BasicLoggerService extends BaseLoggerService<BasicLoggerConfig> {
  protected _emit: (data: ILog) => void;

  constructor(
    @Inject(INQUIRER)
    _context: string | object,

    options: BasicLoggerConfig = basicLoggerConfig,
  ) {
    super(_context, options);
    if (this.context && this.options?.contexts?.[this.context]) {
      const level = this.options?.contexts[this.context];
      this.setLogLevels(LogLevelOrder.slice(0, LogLevelOrder.indexOf(level) + 1));
    }
    switch (this.options?.output) {
      case 'console':
        this._emit = loggerConsoleFormatter;
        break;
      case 'json':
      default:
        this._emit = (data: ILog) => {
          if (data.error) {
            // eslint-disable-next-line
            console.error(JSON.stringify({ ...data, error: serializeError(data.error) }));
          } else {
            // eslint-disable-next-line
            console.log(JSON.stringify(data));
          }
        };
        break;
    }
  }

  send(data: Partial<ILog>): void {
    return this._process({
      context: this.context,
      level: 'log',
      ...data,
    });
  }

  protected _enrich(data: ILog): ILog {
    const store = loggerStore.getStore();
    if (store?.spanId) data.spanId = store?.spanId;
    if (store?.traceId) data.traceId = store?.traceId;

    data.timestamp = Date.now();
    return data;
  }

  protected _process(data: ILog): void {
    if (!this.isLevelEnabled(data.level, data.context)) {
      return;
    }
    this._enrich(data);
    this._emit(data);
  }

  /**
   * Check if the given log level is enabled
   */
  public isLevelEnabled(level: BaseLogLevel, context?: string): boolean {
    if (this.context === context) {
      return this.levels.has(level);
    }
    let setLevel: BaseLogLevel = this.options?.level || 'log';
    if (context && this.options?.contexts?.[context]) {
      setLevel = this.options?.contexts[context];
    }
    return LogLevelOrder.slice(0, LogLevelOrder.indexOf(setLevel) + 1).includes(level);
  }
}
