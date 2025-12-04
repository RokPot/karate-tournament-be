import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';

import { LoggerService } from '~common/logger';
import { AuthenticatedSocket } from '~common/websocket/types/authenticated-socket';

import { WebsocketExampleService } from './websocket-example.service';

@WebSocketGateway({
  cors: true,
})
export class WebsocketExampleGateway {
  constructor(
    private readonly logger: LoggerService,
    private readonly websocketExampleService: WebsocketExampleService,
  ) {}

  @SubscribeMessage('send-message')
  async handleMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { message: string },
  ): Promise<void> {
    const userId = client.data.auth.sub;
    if (!userId) {
      this.logger.error('handleMessage: userId is required');
      return;
    }

    await this.websocketExampleService.broadcastMessage(userId, data.message);
  }
}
