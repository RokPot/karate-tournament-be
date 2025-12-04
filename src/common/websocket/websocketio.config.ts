import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';

import { ConfigDecorator } from '~common/config';

import { SOCKETIO_WEBSOCKET_PROVIDER_NAME } from './providers/socketio/socketio.types';

@ConfigDecorator('websocket')
export class WebsocketConfig {
  @Expose()
  @IsString()
  readonly provider: string = SOCKETIO_WEBSOCKET_PROVIDER_NAME;
}
