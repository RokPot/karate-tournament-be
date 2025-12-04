import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  RequestTimeoutException,
  INestApplication,
} from '@nestjs/common';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

import { getConfig } from '~common/config';

import { HttpConfig } from '../http.config';

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  constructor(private readonly interval: number) {}

  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
    if (this.interval > 0) {
      return next.handle().pipe(
        timeout(this.interval),
        catchError((error) => {
          if (error instanceof TimeoutError) {
            return throwError(() => new RequestTimeoutException(`Operation timed out`));
          }
          return throwError(() => error);
        }),
      );
    }
    return next.handle();
  }
}

export function useTimeoutInterceptor(app: INestApplication) {
  const httpConfig = getConfig(HttpConfig);
  if (httpConfig.timeout > 0) {
    /**
     * Request Timeout after ${config.timeout} seconds
     */
    app.useGlobalInterceptors(new TimeoutInterceptor(httpConfig.timeout));
  }
}
