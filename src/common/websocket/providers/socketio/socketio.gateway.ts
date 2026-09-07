import { UnauthorizedException } from '@nestjs/common';
import { WebSocketGateway, OnGatewayConnection, OnGatewayDisconnect, WebSocketServer } from '@nestjs/websockets';
import * as jwt from 'jsonwebtoken';
import { passportJwtSecret } from 'jwks-rsa';
import { Server, Socket } from 'socket.io';

import { Auth0Config, Auth0Payload } from '~common/auth';
import { LoggerService } from '~common/logger';
import { AuthenticatedSocket } from '~common/websocket/types/authenticated-socket';

import { SocketIOService } from './socketio.service';

export const SOCKET_GATEWAY_NAMESPACE = 'karate-app';

@WebSocketGateway({
  cors: true,
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server?: Server;

  private jwksClient: any;

  constructor(
    private readonly logger: LoggerService,
    private readonly socketService: SocketIOService,
    private readonly auth0Config: Auth0Config,
  ) {
    // Initialize JWKS client for token verification
    this.jwksClient = passportJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: `${auth0Config.issuer}/.well-known/jwks.json`,
    });
  }

  afterInit() {
    if (!this.server) {
      throw new Error('WebSocket Server is not initialized');
    }
    this.socketService.setSocketServer(this.server);
  }

  async handleConnection(client: Socket) {
    try {
      // Get token from handshake auth or headers
      const authHeader =
        client.handshake.auth?.Authorization ||
        client.handshake.auth?.authorization ||
        client.handshake.headers?.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        this.logger.log('Client attempted to connect without valid Authorization header');
        client.disconnect();
        return;
      }

      const token = authHeader.replace('Bearer ', '');

      // Validate JWT token using Auth0 JWKS
      try {
        const decoded = jwt.decode(token, { complete: true });
        if (!decoded || typeof decoded === 'string' || !decoded.header?.kid) {
          throw new UnauthorizedException('Invalid token format');
        }

        const secret = await this.jwksClient(decoded.header, decoded.payload);
        const payload = jwt.verify(token, secret, {
          audience: this.auth0Config.audience,
          issuer: this.auth0Config.issuer,
          algorithms: ['RS256'],
        }) as Auth0Payload;

        if (!payload || !payload.sub) {
          throw new UnauthorizedException('Invalid token payload');
        }

        // Store user data in socket
        client.data.auth = payload;

        await this.socketService.handleConnection(client as AuthenticatedSocket);
      } catch (error) {
        this.logger.error('Error validating WebSocket token:', error);
        client.disconnect();
      }
    } catch (error) {
      this.logger.error('Error during socket connection:', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket): Promise<void> {
    await this.socketService.handleDisconnect(client);
  }
}
