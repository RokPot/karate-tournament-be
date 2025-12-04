import { type DynamicModule, type ModuleMetadata } from '@nestjs/common';

import { InternalServerErrorException } from '~common/exceptions';

/**
 * Combine multiple module metadata objects into a single module metadata object
 */
export function applyModulePlugins<T extends DynamicModule | ModuleMetadata>(main: T, plugins: ModuleMetadata[]): T {
  try {
    return {
      ...main,
      providers: [...(main.providers || []), ...(plugins?.flatMap((plugin) => plugin.providers || []) || [])],
      exports: [...(main.exports || []), ...(plugins?.flatMap((plugin) => plugin.exports || []) || [])],
      controllers: [...(main.controllers || []), ...(plugins?.flatMap((plugin) => plugin.controllers || []) || [])],
      imports: [...(main.imports || []), ...(plugins?.flatMap((plugin) => plugin.imports || []) || [])],
    };
  } catch (e) {
    throw new InternalServerErrorException(
      `Error applying module "${'module' in main ? main.module.name : module}" plugins`,
      { cause: e },
    );
  }
}

/**
 * A deferred promise
 *  - until Promise.withResolvers() is available
 */
class Deferred<T = any> {
  promise: Promise<any>;
  resolve!: (value: T) => void;
  reject!: (reason?: any) => void;

  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.reject = reject;
      this.resolve = resolve;
    });
  }
}

/**
 * Defer the creation of a module until a configuration is provided
 *
 *   Dynamic injection in NestJS works by matching all provider constructor parameters with other loaded providers
 *    ( by 'token', that could also be the class name itself ) and injecting them into the constructor.
 *
 *   The module selects from the providers loaded in the 'provider' array or the 'imports' array. The imported module
 *    is loaded and its exports are added to the list. This process can be sync or async, but the main module will not
 *    be loaded until all imports are resolved. The third source are the @Global modules' exports, but we want to avoid
 *    using them as much as possible.
 *
 *   Multiple modules can export/provide the same provider but each module will have its own instance of the provider.
 *
 *   To have the same instance of a provider, we usually need to import the same module, and have that module resolve
 *    its own dependencies. In a testing context, we then override those settings and provide our own mocks. This is
 *    the NestJS way of doing things, and it's the first thing you should try.
 *
 *   This function however, allows us to break that mold, and bring module configuration into the AppModule and
 *    AppTestingModule, and be available to modules that imported them ( no @Global() scope needed ).
 *
 */
export function deferConfigurableModule<M, ARGS extends Array<any>>(
  moduleDefinition: DynamicModule & { module: M },
  generator: (module: DynamicModule, ...args: ARGS) => DynamicModule,
  options?: {
    timeout: number;
  },
): (...args: ARGS) => Promise<DynamicModule> {
  let promise: Deferred<DynamicModule>;
  let timeout: NodeJS.Timeout | undefined;

  if (!moduleDefinition.module) {
    throw new Error('Module must have a module property');
  }

  return (...args: ARGS) => {
    if (!promise) {
      promise = new Deferred();
      timeout = setTimeout(
        () => {
          promise.reject(new Error(`Module ${moduleDefinition.module.name} configuration timed out`));
        },
        // modules have no reason to take more than milliseconds to resolve, make a generous timeout
        options?.timeout || 5000,
      );
    }
    if (args.length !== 0) {
      if (!timeout) {
        // already resolved, this will always return the same instance of the module
        // if you need another configuration, you need to make another deferComposableModule instance
        throw new Error(`Module ${moduleDefinition.module.name} configuration already resolved`);
      }
      clearTimeout(timeout);
      timeout = undefined;

      try {
        const resolvedDefinition = generator(moduleDefinition, ...args);
        promise.resolve(resolvedDefinition);
      } catch (e) {
        promise.reject(e);
      }
    }
    return promise.promise;
  };
}

/**
 * Return a function that resolves the module ONCE with the provided plugins
 *
 * @param moduleDefinition - Definition to extend from with plugins
 * @param options - Configuration options
 * @param options.timeout - Timeout in milliseconds to wait for the configuration to be provided
 * @returns A function that takes an array of plugins and returns a promise that resolves to the module with the plugins
 *            if no arguments are provided, it will return a promise that resolves when the plugins are provided
 */
export function deferComposableModule<M>(
  moduleDefinition: DynamicModule & { module: M },
  options?: Parameters<typeof deferConfigurableModule>[2],
): (plugins?: ModuleMetadata[], options?: { global: boolean }) => Promise<DynamicModule> {
  return deferConfigurableModule(
    moduleDefinition,
    (mD, plugins?: ModuleMetadata[], options?: { global: boolean }) => {
      return applyModulePlugins(options?.global ? { ...mD, global: true } : mD, plugins!);
    },
    options,
  );
}
