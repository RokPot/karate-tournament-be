# Observability


## Manual logging

The [logger](../../src/common/logging/logger.service.ts) is based on the default Nest.js LoggerService but uses DI.

```typescript
import { LoggerService } from '~common/logger';

@Injectable()
export class AnService {
  constructor(
    private readonly logger: LoggerService
  ) {}
  async anAction(profile: number): Promise<string> {
    this.logger.debug(`Something happened`, { profile });
  }
}
```

## Exceptions

Same as with using the logger, exceptions thrown within Nest, will be logged if the capturing context is set to at least
the level of the exception.

The capturing context is the first one to handle the exception, most of the time you will see either `ExceptionHandler`
or `HttpException` (see below).

To control the log level of an exception, you can use the `BaseException` class. The following exception will get
suppressed if the log level is set to `error` or higher.

```typescript
import { BaseException } from '~common/logger';
throw new BaseException('Something went wrong', { level: 'warn' });
```

> If an exception is not handled with Nest (an unhandled exception), it will bypass the
logger and (by default) crash the server.

### HttpException

HttpException is a special context that logs any errors that happen in the request/response loop. In addition to
using custom levels set by `BaseException` and derivatives, it also uses Nest.js build in HttpException and maps
the status code to the log level. See `~common/exceptions/http-expanded.exception.ts` for more details.

Using Nest build in HttpException errors is thus supported but not recommended. Instead, use the `BaseException` class,
create subclasses where needed, and set the level accordingly.

## Request and response logging

Request and response logging is done automatically by the `ExpressRequestMiddleware` in the `HttpRequest` context.
Logs that are generated in the request/response loop are given spanId and traceId, that can be used to tie them
back to their original request.

The logger exposes a `LoggerStore` that can be used to store additional data used within the request/response loop.
