import type { Response, NextFunction, Request } from 'express';

import type { Auth0Payload } from '~common/auth';
import { getConfig } from '~common/config';
import { HttpConfig } from '~common/http/http.config';
import { makeId } from '~common/utils/short-uuid';

import type { IHttpRequestLog, IHttpResponseLog } from './interfaces';
import { LoggerService } from './logger.service';
import { type ILoggerStore, loggerStore } from './logger.store';

const httpConfig = getConfig(HttpConfig);

export const httpLogger = new LoggerService('HttpRequest');

/**
 * Sanitize sensitive data by replacing values of specific keys with "REDACTED"
 * @param data Object to sanitize
 * @returns Sanitized copy of the object
 */
function sanitizeSensitiveData(data: Record<string, any>): Record<string, any> {
  if (!data || typeof data !== 'object') {
    return data;
  }

  // List of sensitive field names to redact
  const sensitiveFields = ['password', 'token', 'accessToken', 'refreshToken', 'secret', 'apiKey', 'authorization'];

  // Create a deep copy to avoid modifying the original
  const sanitized = { ...data };

  // Replace sensitive values with "REDACTED"
  Object.keys(sanitized).forEach((key) => {
    const lowerKey = key.toLowerCase();
    if (sensitiveFields.some((field) => lowerKey.includes(field))) {
      sanitized[key] = 'REDACTED';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeSensitiveData(sanitized[key]);
    }
  });

  return sanitized;
}

/**
 * Global Express Request Handler Middleware
 *  - runs before guards (and thus before everything else)
 *     and just before response (and thus after everything else)
 *  - injects requestId, and traceId
 *  - logs request and response
 */
export function ExpressLoggerMiddleware(request: Request, response: Response, next: NextFunction) {
  // Start the request timer
  const requestStart = process.hrtime.bigint();

  if (!request.requestMetadata) {
    request.requestMetadata = {
      requestStart,
    };
  }

  const log: Partial<IHttpResponseLog> = {};

  // Inject requestId
  const spanId = makeId();
  if (httpConfig.spanIdHeader) {
    response.setHeader(httpConfig.spanIdHeader, spanId);
  }
  request.requestMetadata.spanId = spanId;
  log.spanId = spanId;

  // Extract traceId
  if (httpConfig.traceIdHeader && request.get(httpConfig.traceIdHeader)) {
    const traceId = request.get(httpConfig.traceIdHeader);
    request.requestMetadata.traceId = traceId;
    log.traceId = traceId;
  }

  const store: ILoggerStore = {
    ...log,
    remoteIp: request.clientIp,
    // requestRoute: `${request.method}:${request.route?.path}`,
    requestUrl: `${request.method}:${request.originalUrl}`,
    userAgent: request.get('User-Agent'),
    requestStart,
    // userId is injected by the auth middleware
  };

  const logData = {
    remoteIp: store.remoteIp,
    requestRoute: store.requestRoute,
    requestUrl: store.requestUrl,
    userAgent: store.userAgent,
    params: {
      query: sanitizeSensitiveData(request.query || {}),
      routeParams: sanitizeSensitiveData(request.params || {}),
      // Body is intentionally omitted here as it's not parsed yet
    },
  };

  if (httpConfig.log) {
    /**
     * Log the response after it finishes
     */
    response.on('finish', () => {
      const user = (request as any).user as Auth0Payload | undefined;
      if (user?.sub) store.userId = user.sub;
      // Capture all params including body which should be parsed by now
      const responseLogData = {
        ...logData,
        params: {
          ...logData.params,
          body: sanitizeSensitiveData(request.body || {}),
        },
        responseCode: response.statusCode,
        userId: store.userId,
        responseTime: +(Number(process.hrtime.bigint() - requestStart) / 1000000).toFixed(2),
      };

      httpLogger.send({
        ...log,
        type: 'http',
        level: 'log',
        code: 'response',
        data: responseLogData,
      } satisfies IHttpResponseLog);
    });
  }

  // Inject into logger
  loggerStore.run(
    store,
    httpConfig.log
      ? () => {
          /**
           *  Log the request before it starts
           *    this might show requests that did not finish
           */
          httpLogger.send({
            ...log,
            type: 'http',
            level: 'verbose',
            code: 'request',
            data: logData,
          } satisfies IHttpRequestLog);
          next();
        }
      : next,
  );
}
