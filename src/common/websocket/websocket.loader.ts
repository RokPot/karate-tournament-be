import { Injectable } from '@nestjs/common';

import { LoggerService } from '~common/logger';

import { WebsocketProvider } from './websocket-provider.abstract';

@Injectable()
export class WebsocketLoader {
  constructor(private readonly logger: LoggerService) {}

  public providers: Record<string, WebsocketProvider> = {};

  /**
   * Register an authn provider by name
   */
  public registerProvider(name: string, provider: WebsocketProvider): void {
    if (name in this.providers) {
      throw new Error(`Provider ${name} already registered`);
    }
    this.logger.debug(`Registered provider {${name}}`);
    this.providers[name] = provider;
  }
}
