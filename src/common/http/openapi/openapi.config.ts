import { Expose } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';

import { ConfigDecorator } from '~common/config';

export enum OpenApiConfigMode {
  'disabled' = 'disabled',
  'runtime' = 'runtime',
  'static' = 'static',
}

@ConfigDecorator('http.openapi')
export class OpenApiConfig {
  @Expose()
  @IsEnum(OpenApiConfigMode)
  mode: OpenApiConfigMode = OpenApiConfigMode.disabled;

  @Expose()
  @IsString()
  @IsOptional()
  path: string = 'docs';

  @Expose()
  @IsString()
  @IsOptional()
  title: string = 'API Docs';

  @Expose()
  @IsString()
  @IsOptional()
  description: string = 'Documentation';

  @Expose()
  @IsString()
  @IsOptional()
  username!: string;

  @Expose()
  @IsString()
  @IsOptional()
  password!: string;
}
