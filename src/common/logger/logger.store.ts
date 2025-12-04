import { AsyncLocalStorage } from 'async_hooks';

/**
 * Context needed for observability
 */
export interface ILoggerStore {
  /**
   * Unique SpanId
   */
  spanId?: string;
  /**
   * Upstream TraceId
   */
  traceId?: string;
  /**
   * Client authenticated UserId or Email
   */
  userId?: string;
  /**
   * Client User Agent
   */
  userAgent?: string;
  /**
   * Client IP Address
   */
  remoteIp?: string;
  /**
   * Request Named Route
   */
  requestRoute?: string;
  /**
   * Request URL
   */
  requestUrl?: string;
  /**
   * Request Start Time
   */
  requestStart?: bigint;
}

export const loggerStore = new AsyncLocalStorage<ILoggerStore>();
