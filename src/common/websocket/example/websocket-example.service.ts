import { Injectable } from '@nestjs/common';

import { LoggerService } from '~common/logger';
import { WebsocketService } from '~common/websocket/websocket.service';

import { MessageSentSuccessEvent } from './events/message-sent.event';

@Injectable()
export class WebsocketExampleService {
  constructor(
    private readonly logger: LoggerService,
    private readonly websocketService: WebsocketService,
  ) {}

  async broadcastMessage(userId: string, message: string): Promise<void> {
    this.logger.debug(`Broadcasting message from user ${userId}: ${message}`);
    this.websocketService.publishMessage(new MessageSentSuccessEvent(userId, message));
  }
}
