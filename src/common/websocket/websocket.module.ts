import { Module } from '@nestjs/common';

import { getConfigFactory } from '~common/config';
import { deferComposableModule } from '~common/utils/nestjs';

import { WebsocketLoader } from './websocket.loader';
import { WebsocketService } from './websocket.service';
import { WebsocketConfig } from './websocketio.config';

@Module({})
export class WebsocketModule {
  static forRoot = deferComposableModule({
    module: WebsocketModule,
    //global: true, // required for guards
    providers: [
      //
      getConfigFactory(WebsocketConfig),
      WebsocketLoader,
      WebsocketService,
    ],
    exports: [
      //
      WebsocketService,
      WebsocketLoader,
    ],
  });
}
