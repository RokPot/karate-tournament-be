import { Expose, Transform } from 'class-transformer';
import { Allow, IsString } from 'class-validator';

import { ConfigDecorator } from '~common/config';

import { BaseLoggerConfig } from '../base-logger.config';
import type { BaseLogLevel } from '../base-logger.service';

@ConfigDecorator('logger')
export class BasicLoggerConfig extends BaseLoggerConfig {
  @Expose()
  @IsString()
  output = 'json';

  @Expose()
  @Allow()
  @Transform((value) => value.obj?.contexts)
  contexts?: Record<string, BaseLogLevel>;
}
