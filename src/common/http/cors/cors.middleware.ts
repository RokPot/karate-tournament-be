import { INestApplication } from '@nestjs/common';
import { Expose, Transform } from 'class-transformer';
import { IsNumber } from 'class-validator';

import { ConfigDecorator, getConfig } from '~common/config';
import { ValidateInline } from '~common/validate';

/**
 * CORS Configuration
 * @see https://github.com/expressjs/cors#configuration-options
 */
@ConfigDecorator('http.cors')
export class CorsConfig {
  /**
   * The URL to allow CORS requests from
   *  - false for none
   *  - true for all
   *  - string for array of comma separated RegExp
   *  - array for RegExp
   */
  @Expose()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      if (value === 'false') return false;
      if (value === 'true' || value === '*') return true;
      return value.split(',').map((x) => RegExp(x));
    } else if (Array.isArray(value)) {
      return value.map((x) => RegExp(x));
    }
    return value; // boolean
  })
  @ValidateInline(
    ({ value }) => typeof value === 'boolean' || (Array.isArray(value) && value.every((x: any) => x instanceof RegExp)),
  )
  origin: RegExp[] | boolean = true;

  @Expose()
  @IsNumber()
  maxAge = 3600;
}

const corsConfig = getConfig(CorsConfig);

export function useCors(app: INestApplication) {
  app.enableCors({
    maxAge: corsConfig.maxAge,
    // Configures the Access-Control-Allow-Credentials CORS header.
    credentials: true,
    origin: corsConfig.origin,
  });
}
