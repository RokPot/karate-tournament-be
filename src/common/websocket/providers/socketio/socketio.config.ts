import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';

import { ConfigDecorator } from '~common/config';

@ConfigDecorator('websocket.socketio')
export class SocketIOConfig {
  @Expose()
  @IsString()
  readonly serverUrl: string = '';
}
