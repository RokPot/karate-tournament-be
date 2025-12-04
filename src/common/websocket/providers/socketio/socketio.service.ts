import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

import { LoggerService } from '~common/logger';

import { AuthenticatedSocket } from '../../types/authenticated-socket';

@Injectable()
export class SocketIOService {
  private io!: Server;
  constructor(private readonly logger: LoggerService) {}

  private readonly clients = new Map<string, AuthenticatedSocket>();
  private readonly userConnections = new Map<string, Set<string>>();

  setSocketServer(server: Server) {
    this.io = server;
  }

  async handleConnection(socket: AuthenticatedSocket): Promise<void> {
    const clientId = socket.id;
    const userId = socket.data.auth.sub;

    // Initialize user connections set if it doesn't exist
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set());
    }

    // Add the new socket ID to user's connections
    this.userConnections.get(userId)!.add(clientId);
    this.clients.set(clientId, socket);

    await this.subscribeToUserChannel(socket);

    this.logger.debug(
      `Client connected: ${clientId}, userId: ${userId}. Total connections for user: ${
        this.userConnections.get(userId)!.size
      }`,
    );
  }

  async handleDisconnect(socket: AuthenticatedSocket): Promise<void> {
    const clientId = socket.id;
    const userId = socket.data?.auth?.sub;

    this.clients.delete(clientId);

    // Remove the socket ID from user's connections
    if (userId) {
      const userConnections = this.userConnections.get(userId);
      if (userConnections) {
        userConnections.delete(clientId);
        if (userConnections.size === 0) {
          this.userConnections.delete(userId);
        }
      }
    }

    if (userId) {
      await this.unsubscribeFromUserChannel(socket);
    }
    this.logger.debug(
      `Client disconnected: ${clientId}, userId: ${userId}. Remaining connections for user: ${
        this.userConnections.get(userId)?.size ?? 0
      }`,
    );
  }

  publishMessage(userId: string, messageName: string, message: any): void {
    const channelName = this.getUserChannel(userId);
    this.io.to(channelName).emit(messageName, message);
    // this.logger.log(`Broadcasting message to channel ${channelName}: ${messageName}`);
  }

  async joinChannel(socket: AuthenticatedSocket, channelName: string): Promise<void> {
    await socket.join(channelName);
    this.logger.debug(`Client ${socket.id} joined channel ${channelName}`);
  }

  async leaveChannel(socket: AuthenticatedSocket, channelName: string): Promise<void> {
    await socket.leave(channelName);
    this.logger.debug(`Client ${socket.id} left channel ${channelName}`);
  }

  getUserChannel(userId: string): string {
    return `user:${userId}`;
  }

  async subscribeToUserChannel(socket: AuthenticatedSocket): Promise<void> {
    const userChannel = this.getUserChannel(socket.data.auth.sub);
    await this.joinChannel(socket, userChannel);
    this.logger.debug(`Client ${socket.id} subscribed to user channel ${userChannel}`);
  }

  async unsubscribeFromUserChannel(socket: AuthenticatedSocket): Promise<void> {
    const userChannel = this.getUserChannel(socket.data.auth.sub);
    await this.leaveChannel(socket, userChannel);
    this.logger.debug(`Client ${socket.id} unsubscribed from user channel ${userChannel}`);
  }

  publishToUser(userId: string, messageName: string, message: any): void {
    const userChannel = this.getUserChannel(userId);
    this.publishMessage(userChannel, messageName, message);
  }
}
