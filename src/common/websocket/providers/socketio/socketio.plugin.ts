import { type ModuleMetadata } from '@nestjs/common';

import { Auth0Config } from '~common/auth';
import { getConfigFactory } from '~common/config';

import { SocketIOConfig } from './socketio.config';
import { SocketGateway } from './socketio.gateway';
import { SocketIOProvider } from './socketio.provider';
import { SocketIOService } from './socketio.service';

export const SocketIOWebsocketPlugin: ModuleMetadata = {
  providers: [
    //
    SocketGateway,
    getConfigFactory(SocketIOConfig),
    getConfigFactory(Auth0Config),
    SocketIOProvider,
    SocketIOService,
  ],
  exports: [SocketIOProvider, SocketIOService],
};
