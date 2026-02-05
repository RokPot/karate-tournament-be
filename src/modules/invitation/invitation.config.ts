import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';

import { ConfigDecorator } from '~common/config';

@ConfigDecorator('invitation')
export class InvitationConfig {
  /**
   * Frontend base URL for building invite links (e.g. https://app.example.com)
   */
  @Expose()
  @IsString()
  frontendBaseUrl!: string;
}
