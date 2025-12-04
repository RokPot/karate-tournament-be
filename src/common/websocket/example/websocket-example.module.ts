import { Module } from '@nestjs/common';

import { WebsocketModule } from '~common/websocket/websocket.module';

import { WebsocketExampleController } from './websocket-example.controller';
import { WebsocketExampleGateway } from './websocket-example.gateway';
import { WebsocketExampleService } from './websocket-example.service';

@Module({
  imports: [WebsocketModule.forRoot()],
  controllers: [WebsocketExampleController],
  providers: [WebsocketExampleService, WebsocketExampleGateway],
})
export class WebsocketExampleModule {}
