import { Expose } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

import { ConfigDecorator } from '~common/config';

@ConfigDecorator('core')
export class CoreConfig {
  @Expose()
  @IsString()
  readonly service: string = 'api';

  @Expose()
  @IsString()
  @IsOptional()
  readonly stage?: string;

  @Expose()
  @IsString()
  @IsOptional()
  readonly version?: string;

  @Expose()
  @IsString()
  @IsOptional()
  readonly release?: string;

  @Expose()
  @IsString()
  @IsOptional()
  readonly buildTime?: string;

  /**
   * Url to this api, without end slash
   */
  @Expose()
  @IsString()
  @IsOptional()
  readonly apiBaseUrl?: string;

  @Expose()
  @IsString()
  @IsOptional()
  readonly webBaseUrl?: string;
}
