import { Injectable, OnApplicationBootstrap } from '@nestjs/common';

import { LoggerService } from '~common/logger';
import { SocketEvent } from '~common/websocket/events/socket.event';
import { WebsocketProvider } from '~common/websocket/websocket-provider.abstract';
import { WebsocketLoader } from '~common/websocket/websocket.loader';

import { SocketIOService } from './socketio.service';
import { SOCKETIO_WEBSOCKET_PROVIDER_NAME } from './socketio.types';

@Injectable()
export class SocketIOProvider implements WebsocketProvider, OnApplicationBootstrap {
  constructor(
    private readonly logger: LoggerService,
    private readonly loader: WebsocketLoader,
    private readonly socketService: SocketIOService,
  ) {}

  onApplicationBootstrap(): any {
    this.loader.registerProvider(SOCKETIO_WEBSOCKET_PROVIDER_NAME, this);
  }

  publishMessage(event: SocketEvent) {
    try {
      // this.logger.debug('publishMessage', event);
      const userId = event.payload.userId;
      if (userId) {
        this.socketService.publishMessage(userId, event.type, event.payload);
      }
    } catch (error) {
      this.logger.error(
        `There was a problem trying to publish a message to socketio channel ${event.channelName}.`,
        error,
      );
    }
  }

  health(): Promise<void> {
    return Promise.resolve(undefined);
  }
}
