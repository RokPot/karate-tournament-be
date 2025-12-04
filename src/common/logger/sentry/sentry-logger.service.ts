import { captureException, captureMessage } from '@sentry/nestjs';

import { getConfig } from '~common/config';

import { type BaseLogLevel, LogLevelOrder } from '../base-logger.service';
import { BasicLoggerService } from '../basic/basic-logger.service';
import { type ILog } from '../interfaces';

import { SentryConfig } from './sentry.config';

const sentryConfig = getConfig(SentryConfig);
const sentryContextLevels = Object.entries(sentryConfig.contexts ?? {}).reduce((acc, [context, level]) => {
  if (!LogLevelOrder.includes(level)) {
    return acc;
  }
  acc.set(context, new Set(LogLevelOrder.slice(0, LogLevelOrder.indexOf(level) + 1)));
  return acc;
}, new Map<string, Set<BaseLogLevel>>());
const sentryLevels = new Set(LogLevelOrder.slice(0, LogLevelOrder.indexOf(sentryConfig.level) + 1));

const sentryLevelMap: Record<BaseLogLevel, 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug'> = {
  fatal: 'fatal',
  error: 'error',
  warn: 'warning',
  log: 'log',
  debug: 'info',
  verbose: 'info',
  none: 'fatal', // should never be used
};

export class SentryLoggerService extends BasicLoggerService {
  protected _process(data: ILog): void {
    const logEnabled = this.isLevelEnabled(data.level, data.context);

    const sentryEnabled =
      sentryConfig.dsn && data.context && sentryContextLevels.has(data.context)
        ? sentryContextLevels.get(data.context)!.has(data.level)
        : sentryLevels.has(data.level);

    if (!logEnabled && !sentryEnabled) {
      return;
    }

    if (!logEnabled && sentryEnabled) {
      return;
    }

    if (data.data?.userAgent === 'ELB-HealthChecker/2.0') {
      return;
    }

    this._enrich(data);
    if (logEnabled) {
      this._emit(data);
    }
    if (sentryEnabled) {
      const extra = {
        level: sentryLevelMap[data.level],
        extra: data.data,
        tags: {
          context: data.context,
          code: data.code,

          // todo, check if we can merge with Sentry's own traceId/spanId
          traceId: data.traceId,
          spanId: data.spanId,
        },
      };
      if (data.error || data.stack) {
        captureException(data.error || data.stack, extra);
      } else {
        captureMessage(data.message || data.type || 'unknown', extra);
      }
    }
  }
}
