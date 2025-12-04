import { Expose, Type } from 'class-transformer';
import { IsNumber } from 'class-validator';

import { ConfigDecorator } from '~common/config';

@ConfigDecorator('http.pagination')
export class PaginationConfig {
  @Expose()
  @IsNumber()
  @Type(() => Number)
  limitMin = 1;

  @Expose()
  @IsNumber()
  @Type(() => Number)
  limitMax = 20;

  @Expose()
  @IsNumber()
  @Type(() => Number)
  limitDefault = 20;
}
