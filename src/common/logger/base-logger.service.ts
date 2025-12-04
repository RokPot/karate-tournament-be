import { Global, Inject, Injectable, LogLevel, Optional, Scope } from '@nestjs/common'; // eslint-disable-line import/no-duplicates
import { LoggerService } from '@nestjs/common'; // eslint-disable-line no-restricted-imports, import/no-duplicates
import { INQUIRER } from '@nestjs/core';

import { BaseLoggerConfig } from './base-logger.config';

export interface IBaseLog {
  /**
   * Log level
   *  - used for filtering, default to 'log'
   */
  level: BaseLogLevel;

  /**
   * Context of the log message
   * - usually the injector class
   */
  context?: string;

  /**
   * Type of log message
   * - used for formatting and filtering
   * - examples: metric, query, event, request, etc.
   */
  type?: string;

  /**
   * Human-readable message
   */
  message?: string;

  /**
   * Log code
   *  - used to uniquely identify the event
   */
  code?: string;

  /**
   *  Data to log
   *   - facets, metrics, etc.
   */
  data?: Record<string, any>;

  /**
   * Error that caused the log
   */
  error?: Error;

  /**
   * Stack trace
   * @deprecated nest.js internal
   */
  stack?: string;

  /**
   * Additional messages
   * @deprecated nest.js internal
   */
  messages?: unknown[];
}

export type BaseLogLevel = LogLevel | 'none';
export const LogLevelOrder: BaseLogLevel[] = ['none', 'fatal', 'error', 'warn', 'log', 'debug', 'verbose'];

const isPlainObject = (val: any): val is object =>
  !!val && typeof val === 'object' && (val.__proto__ === null || val.__proto__ === Object.prototype);

const isStackFormat = (stack: unknown): stack is string => {
  if (!(typeof stack === 'string') && !(typeof stack === 'undefined')) {
    return false;
  }
  return /^(.)+\n\s+at .+:\d+:\d+/.test(stack as string);
};

/**
 * Generalized logger service based on the NestJS LoggerService
 *  - converts all logs into the BaseLogInstance format
 */
@Global()
@Injectable({ scope: Scope.TRANSIENT })
export class BaseLoggerService<T extends BaseLoggerConfig = BaseLoggerConfig, R = void> implements LoggerService {
  protected context?: string;

  /**
   * Log level specific for the module
   * @private
   */
  protected levels: Set<BaseLogLevel> = new Set();

  constructor(
    /**
     * Class of the injecting service
     */
    @Inject(INQUIRER) context?: string | object,

    @Optional()
    protected options?: T,
  ) {
    this.setContext(typeof context === 'string' ? context : context?.constructor?.name);
    this.setLogLevels(LogLevelOrder.slice(0, LogLevelOrder.indexOf(this.options?.level || 'log') + 1));
  }

  /**
   * Write a log
   * @example logger.send({ data: { key: any }, type: 'metric' });
   * @example logger.send({ error: Error, level: 'error' });
   */
  send(data: Partial<IBaseLog>): R | void {
    return this._process({
      context: this.context,
      level: 'log',
      ...data,
    });
  }

  /**
   * Write a 'log' level log
   * @example logger.log('message', { key: any });
   */
  log(data: Record<string, any>): R;
  log(message: any, context?: string): R;
  log(message: any, data: Record<string, any>, context?: string): R;
  /** @deprecated nest.js internal */
  log(message: any, ...optionalParams: [...any, string?]): R;
  log(message: any, ...optionalParams: any[]): R | void {
    return this._process(this._toLogInstance([message, ...optionalParams], 'log'));
  }

  /**
   * Write a 'error' level log
   * @example logger.error('message', { key: any }, Error);
   */
  error(error?: Error): R;
  error(data: Record<string, any>): R;
  error(message: any, context?: string): R;
  error(message: any, error?: Error, context?: string): R;
  error(message: any, data: Record<string, any>, error?: Error, context?: string): R;
  /** @deprecated nest.js internal */
  error(message: any, stack?: string, context?: string): R;
  error(message: any, ...optionalParams: [...any, string?, string?]): R;
  error(message: any, ...optionalParams: any[]): R | void {
    return this._process(this._toLogInstanceWithErrors([message, ...optionalParams], 'error'));
  }

  /**
   * Write a 'warn' level log
   * @example logger.warn('message', { key: any });
   */
  warn(data: Record<string, any>): R;
  warn(message: any, context?: string): R;
  warn(message: any, data: Record<string, any>, context?: string): R;
  /** @deprecated nest.js internal */
  warn(message: any, ...optionalParams: [...any, string?]): R;
  warn(message: any, ...optionalParams: any[]): R | void {
    return this._process(this._toLogInstance([message, ...optionalParams], 'warn'));
  }

  /**
   * Write a 'debug' level log
   * @example logger.debug('message', { key: any });
   */
  debug(data: Record<string, any>): R;
  debug(message: any, context?: string): R;
  debug(message: any, data: Record<string, any>, context?: string): R;
  /** @deprecated nest.js internal */
  debug(message: any, ...optionalParams: [...any, string?]): R;
  debug(message: any, ...optionalParams: any[]): R | void {
    return this._process(this._toLogInstance([message, ...optionalParams], 'debug'));
  }

  /**
   * Write a 'verbose' level log
   * @example logger.verbose('message', { key: any });
   */
  verbose(data: Record<string, any>): R;
  verbose(message: any, context?: string): R;
  verbose(message: any, data: Record<string, any>, context?: string): R;
  /** @deprecated nest.js internal */
  verbose(message: any, ...optionalParams: [...any, string?]): R;
  verbose(message: any, ...optionalParams: any[]): R | void {
    return this._process(this._toLogInstance([message, ...optionalParams], 'verbose'));
  }

  /**
   * Write a 'fatal' level log
   * @example logger.fatal('message', { key: any });
   */
  fatal(data: Record<string, any>): R;
  fatal(message: any, context?: string): R;
  fatal(message: any, data: Record<string, any>, context?: string): R;
  /** @deprecated nest.js internal */
  fatal(message: any, ...optionalParams: [...any, string?]): R;
  fatal(message: any, ...optionalParams: any[]): R | void {
    return this._process(this._toLogInstance([message, ...optionalParams], 'fatal'));
  }

  /**
   * Set logger context
   *  - default to options.level or 'log'
   */
  public setContext(context?: string) {
    this.context = context;
  }

  /**
   * Set what levels of logs to enable
   */
  public setLogLevels(levels: BaseLogLevel[]) {
    this.levels = new Set(levels);
  }

  /**
   * Check if the given log level is enabled
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public isLevelEnabled(level: BaseLogLevel, context?: string): boolean {
    return this.levels.has(level);
  }

  /**
   * Convert a nest.js like log message to a LogInstance
   * @param args - [ message?, ...messages?, data?: Record<string, any>, context?: string ]
   * @param level
   */
  protected _toLogInstance(args: unknown[], level: BaseLogLevel): IBaseLog {
    if (args?.length < 1) {
      return { context: this.context, level: level };
    }

    const instance: IBaseLog = {
      context: this.context,
      level,
    };
    if (args?.length === 1) {
      if (isPlainObject(args[0])) {
        // [data]
        instance.data = args[0] as Record<string, any>;
      } else if (typeof args[0] === 'string') {
        // [message]
        instance.message = args[0] as string;
      } else {
        // unknown parameter, stringify
        instance.message = JSON.stringify(args[0]);
      }
    } else {
      if (typeof args[args.length - 1] === 'string') {
        // [..., context]
        instance.context = args.pop() as string;
      }

      if (isPlainObject(args[args.length - 1])) {
        // [..., data, context?]
        instance.data = args.pop() as Record<string, any>;
      }

      if (typeof args[0] === 'string') {
        // [message, ...]
        instance.message = args[0] as string;
      }

      if (args.length > 1) {
        // [message, ...messages, ...]
        instance.messages = args.slice(1);
      }
    }
    return instance;
  }

  /**
   * Convert a nest.js like error log message to a LogInstance
   * @param args - [ message?, ...messages?, data?: Record<string, any>, error?: Error, context?: string ]
   * @param level
   */
  protected _toLogInstanceWithErrors(args: unknown[], level: BaseLogLevel): IBaseLog {
    if (args?.length < 1) {
      return { context: this.context, level: level };
    }

    const instance: IBaseLog = {
      context: this.context,
      level,
    };

    if (args?.length === 1) {
      if (args[0] instanceof Error) {
        // [error]
        instance.error = args[0];
      } else if (isStackFormat(args[0])) {
        // [stack]
        instance.stack = args[0] as string;
      } else if (isPlainObject(args[0])) {
        // [data]
        instance.data = args[0] as Record<string, any>;
      } else if (typeof args[0] === 'string') {
        // [message]
        instance.message = args[0] as string;
      } else {
        // unknown parameter, stringify
        instance.message = JSON.stringify(args[0]);
      }
    } else {
      // [..., stack|context]
      if (typeof args[args.length - 1] === 'string') {
        if (isStackFormat(args[args.length - 1])) {
          // [..., stack]
          instance.stack = args.pop() as string;
        } else {
          // [..., context]
          instance.context = args.pop() as string;
        }
      }

      if (!instance.stack) {
        if (args[args.length - 1] instanceof Error) {
          // [..., error, ...]
          instance.error = args.pop() as Error;
        } else if (isStackFormat(args[args.length - 1])) {
          // [..., stack, ...]
          instance.stack = args.pop() as string;
        }
      }

      if (isPlainObject(args[args.length - 1])) {
        // [..., data, ...]
        instance.data = args.pop() as Record<string, any>;
      }

      if (typeof args[0] === 'string') {
        // [message, ...]
        instance.message = args[0] as string;
      }

      if (args.length > 1) {
        // [message, ...messages, ...]
        instance.messages = args.slice(1);
      }
    }

    return instance;
  }

  /**
   * Process the LogInstance
   */
  protected _process(instance: IBaseLog): R | void {
    if (!this.isLevelEnabled(instance.level, instance.context)) {
      return;
    }

    // eslint-disable-next-line no-console
    console.log(instance);
  }
}

export interface IBaseLoggerService extends BaseLoggerService {}
