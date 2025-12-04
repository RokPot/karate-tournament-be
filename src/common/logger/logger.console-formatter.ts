/* eslint no-console: 0 */

import { green, blue, red, gray, bold, cyan, bgMagenta, bgWhite, bgBlue, bgYellow, bgRed, yellow } from 'chalk';
import { DateTime } from 'luxon';

import type { IHttpResponseLog, ILog } from './interfaces';

const timeFormat = 'yyyy-LL-dd HH:mm:ss.SSS';
export function loggerConsoleFormatter(_log: ILog) {
  let level: string = _log.level ?? 'unknown';
  switch (level) {
    case 'verbose':
    case 'debug':
    case 'trace':
      level = bgMagenta(bold(level));
      break;
    case 'log':
      level = bgWhite(bold(level));
      break;
    case 'info':
      level = bgBlue(bold(level));
      break;
    case 'warn':
      level = bgYellow(bold(level));
      break;
    case 'error':
    default:
      level = bgRed(bold(level));
      break;
  }
  switch (_log.type) {
    case 'http': {
      const log = _log as IHttpResponseLog;
      const timestampt = log.timestamp ? DateTime.fromMillis(log.timestamp).toFormat(timeFormat) : '-';
      const context = log.context;
      const traceId = log.traceId ? `${log.traceId}` : '';
      const spanId = log.spanId ? `${log.spanId}` : '';
      const traceAndSpan = `[${traceId},${spanId}]`;
      const remoteIp = log.data.remoteIp ?? '-';
      const userId = log.data.userId ?? '-';
      const requestUrl = log.data.requestUrl ?? '-';
      const responseCode = log.data.responseCode || 0;
      const responseTime = log.data.responseTime ? `${log.data.responseTime}ms` : '-';

      // color the request url, response code and response time based on the response code
      let requestInfo = [requestUrl, responseCode, responseTime].join(' ');
      if (responseCode >= 500) {
        requestInfo = red(requestInfo);
      } else if (responseCode >= 400) {
        requestInfo = yellow(requestInfo);
      } else {
        requestInfo = green(requestInfo);
      }

      console.log(`${timestampt} ${context} ${level} ${traceAndSpan} ${remoteIp} ${userId} ${requestInfo}`);

      // Log request parameters if they exist
      if (log.data.params) {
        if (Object.keys(log.data.params.query || {}).length > 0) {
          console.log('Request Query:', log.data.params.query);
        }
        if (Object.keys(log.data.params.routeParams || {}).length > 0) {
          console.log('RequestRoute Params:', log.data.params.routeParams);
        }
        if (Object.keys(log.data.params.body || {}).length > 0) {
          console.log('Request Body:', log.data.params.body);
        }
      }
      break;
    }
    case 'query': {
      const log = _log as ILog;
      let query = log.data?.query ?? '';
      if (log.data?.params && Array.isArray(log.data.params)) {
        try {
          // insert actual values for easy debugging
          const params = log.data.params;
          query = query.replace(/\$[0-9]+/g, (match: string) => {
            const index = parseInt(match.slice(1)) - 1;
            return index in params ? blue(`${params[index]}`) : match;
          });
        } catch (e) {
          query += log.data.params;
        }
      }
      console.log(
        `[${log.timestamp ? DateTime.fromMillis(log.timestamp).toFormat(timeFormat) : '-'}] ` +
          `${log.context}${log.data?.connection === 'default' ? '' : `[${log.data?.connection}]`} ${level} ` +
          `${log.traceId ? `${log.traceId} ` : ''}` +
          `${log.spanId ? `${log.spanId} ` : ''}` +
          `${log.data?.duration ? `${log.data?.duration}ms ` : '- '}`,
      );
      console.log(cyan(query));
      break;
    }
    default: {
      const log = _log as ILog;
      console.log(
        `[${log.timestamp ? DateTime.fromMillis(log.timestamp).toFormat(timeFormat) : '-'}] ` +
          `${log.context} ${level} ` +
          `${log.traceId ? `${log.traceId} ` : ''}` +
          `${log.spanId ? `${log.spanId} ` : ''}` +
          `${log.code ? green(log.code) + ' ' : ''}` +
          `${log.message ?? ''}`,
      );
      if (log.data) {
        console.log(log.data);
      }
      if (log.error) {
        if ('toConsole' in log.error && typeof log.error.toConsole === 'function') {
          console.log(gray(log.error.toConsole()));
        } else {
          console.log(log.error);
        }
      } else if (log.stack) console.log(log.stack);
    }
  }
}
