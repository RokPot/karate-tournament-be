import { Expose } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

import { ConfigDecorator } from '~common/config';

@ConfigDecorator('maintenance')
export class MaintenanceConfig {
  /**
   * Shared secret for the x-maintenance-key header.
   * Empty means the cleanup endpoint refuses every request.
   */
  @Expose()
  @IsOptional()
  @IsString()
  readonly key: string = '';
}
