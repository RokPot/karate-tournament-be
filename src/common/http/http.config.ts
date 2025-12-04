import { Expose, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

import { ConfigDecorator } from '~common/config';
import { TransformInputToBoolean } from '~common/validate';

@ConfigDecorator('http')
export class HttpConfig {
  @Expose()
  @IsNumber()
  @Type(() => Number)
  port = 3000;

  @Expose()
  @IsString()
  host = '0.0.0.0';

  @Expose()
  @IsBoolean()
  @TransformInputToBoolean()
  log: boolean = true;

  /**
   * Timeout in milliseconds
   *  - CloudFront default is 30s, max is 60s
   *  - 0 for no timeout
   */
  @Expose()
  @IsNumber()
  @Type(() => Number)
  timeout = 60000;

  /**
   * The header to fetch and respond with the trace ID
   *  - CloudFront uses 'X-Amz-Cf-Id'
   *  - X-ray uses 'X-Amzn-Trace-Id'
   */
  @Expose()
  @IsString()
  @IsOptional()
  traceIdHeader?: string;

  /**
   * The header to respond with the span ID
   *  - span id is internally generated, a short-uuid
   */
  @Expose()
  @IsString()
  spanIdHeader = 'x-api-span-id';

  /*
    Validate response body against the schema defined by class-validator decorators
    on the presentation dto classes.
    - ignore: do not validate
    - warn: log a warning if validation fails
    - throw: throw an exception if validation fails and return a 500
  */
  @Expose()
  @IsEnum(['warn', 'ignore', 'throw'], { message: 'must be one of the following values: warn, ignore, throw' })
  validateResponse: string = 'warn';
}
