import { type SocketEvent } from './events/socket.event';

export abstract class WebsocketProvider {
  public abstract publishMessage(event: SocketEvent): void;

  /**
   * Health check for the authn provider
   *  and a convenient way to avoid TS2559 (weak type detection)
   */
  public abstract health(): Promise<void>;
}
