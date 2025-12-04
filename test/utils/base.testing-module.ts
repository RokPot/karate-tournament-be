import { type INestApplication, type ModuleMetadata } from '@nestjs/common';
import { type Provider } from '@nestjs/common/interfaces/modules/provider.interface';
import { Test, type TestingModuleBuilder } from '@nestjs/testing';

import { LoggerModule } from '~common/logger';
import { applyModulePlugins } from '~common/utils/nestjs';

/**
 * Prepare a testing application for e2e tests
 */
export async function createBaseTestingModule(
  /**
   * Extra modules to inject into the testing app
   */
  plugins?: ModuleMetadata[] | ModuleMetadata,
  options?: {
    beforeCompile?: (builder: TestingModuleBuilder) => TestingModuleBuilder;
    beforeInit?: (app: INestApplication<any>) => INestApplication<any>;
    overrideProviders?: Array<Provider | [any, any]>;
  },
): Promise<INestApplication> {
  let builder = Test.createTestingModule(
    applyModulePlugins(
      {
        imports: [
          //
          LoggerModule,
        ],
      },
      plugins ? (Array.isArray(plugins) ? plugins : [plugins]) : [],
    ),
  );

  /**
   * Custom overrides
   */
  if (options?.beforeCompile) {
    builder = options.beforeCompile(builder);
  }

  if (options?.overrideProviders) {
    for (const override of options.overrideProviders) {
      let provide;
      let useValue;
      let useClass;
      if (Array.isArray(override)) {
        provide = override[0];
        useValue = override[1];
      } else {
        if (!('provide' in override)) {
          throw new Error('Expected provider in mock');
        }
        provide = override.provide;
        useValue = 'useValue' in override ? override.useValue : undefined;
        useClass = 'useClass' in override ? override.useClass : undefined;
      }
      if (useValue) {
        builder = builder.overrideProvider(provide).useValue(useValue);
      } else if (useClass) {
        builder = builder.overrideProvider(provide).useClass(useClass);
      } else {
        throw new Error('Expected provider in mock');
      }
    }
  }

  let app = (await builder.compile()).createNestApplication();

  app.enableShutdownHooks();

  if (options?.beforeInit) {
    app = options.beforeInit(app);
  }

  return await app.init();
}
