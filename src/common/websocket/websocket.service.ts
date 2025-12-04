import { Injectable } from '@nestjs/common';

import { SocketEvent } from './events/socket.event';
import { WebsocketProvider } from './websocket-provider.abstract';
import { WebsocketLoader } from './websocket.loader';
import { WebsocketConfig } from './websocketio.config';

@Injectable()
export class WebsocketService {
  constructor(
    private readonly configService: WebsocketConfig,
    private readonly loader: WebsocketLoader,
  ) {}

  getProvider(): WebsocketProvider {
    return this.loader.providers[this.configService.provider];
  }

  publishMessage(event: SocketEvent): void {
    const providerService = this.getProvider();
    if (!providerService) {
      throw new Error(`Provider ${this.configService.provider} not found`);
    }
    providerService.publishMessage(event);
  }
}
