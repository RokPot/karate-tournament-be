import { type INestApplication, type ModuleMetadata, type Provider } from '@nestjs/common';
import { type TestingModuleBuilder } from '@nestjs/testing';
import * as nock from 'nock';

import { requestPipes } from '~app.pipes';
import { createBaseTestingModule } from '~test/utils/base.testing-module';

export async function createRestTestingModule(
  /**
   * Extra modules to inject into the testing app
   */
  plugins?: ModuleMetadata[] | ModuleMetadata,
  options?: {
    beforeCompile?: (builder: TestingModuleBuilder) => TestingModuleBuilder;
    beforeInit?: (app: INestApplication<any>) => INestApplication<any>;
    network?: string[];
    setupPipes?: ((app: INestApplication<any>) => void) | false;
    overrideProviders?: Array<Provider | [any, any]>;
  },
): Promise<INestApplication> {
  /**
   * Disable network connections
   */
  if (Array.isArray(options?.network)) {
    nock.disableNetConnect();
    const hosts = ['localhost', '127.0.0.1', ...options.network];
    nock.enableNetConnect((host) => hosts.some((x: string) => host.includes(x)));
  }

  return createBaseTestingModule([...(plugins ? (Array.isArray(plugins) ? plugins : [plugins]) : [])], {
    beforeCompile: options?.beforeCompile,
    beforeInit: (app) => {
      /**
       * Apply request pipes
       *  - turn off specific pipes with config
       */
      if (options?.setupPipes !== false) {
        (options?.setupPipes ?? requestPipes)(app);
      }

      return options?.beforeInit ? options.beforeInit(app) : app;
    },
    overrideProviders: options?.overrideProviders,
  });
}
