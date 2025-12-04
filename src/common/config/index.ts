/**
 * A simple configuration loader build on top of [CosmiConfig](https://www.npmjs.com/package/cosmiconfig) for loading
 * resolved configuration from the file system.
 *
 * The configuration is loaded on first use, and is stored in memory raw. Once a module requests the configuration,
 * it is resolved, validated, cached and returned.
 *
 *  **For a configuration file**
 *  ```yaml
 *  s3:
 *    bucket: my-bucket
 *  ```
 *
 *  **You can create a class**
 *  ```typescript
 *  @ConfigDecorator('s3')
 *  export class S3Config {
 *    bucket!: string;
 *  }
 *  ```
 *
 *  **Use it in a module**
 *  ```typescript
 *  @Module({ providers: [ getConfigFactory(S3Config) ] })
 *  export class AppModule {}
 *  ```
 *
 *  **Or use it directly**
 *  ```typescript
 *  const s3Config = getConfig(S3Config);
 *  ```
 */

import { type ClassConstructor } from 'class-transformer';

import { plainToValidatedInstance } from '~common/validate';

import { readConfig } from './config.helpers';

/**
 * Global default raw configuration object
 *  do not use directly, use loadConfig with a typed config instead
 */
const rawConfig = readConfig({
  moduleName: `${process.env.STAGE || 'local'}.api`,
  directory: `${process.cwd()}/.config/`,
});

const configCache = new Map<string, any>();

export function ConfigDecorator(configKey: string) {
  return function (cls: any) {
    cls.__config_key = configKey;
    return cls;
  };
}

/**
 * Get a raw configuration object
 *  use getConfig instead
 */
export function getRawConfig<T extends object>(cls: ClassConstructor<T>, _configKey?: string): T {
  const configKey = _configKey ?? (cls as any).__config_key;

  if (!configKey) {
    throw new Error(`${cls.name} class missing @ConfigDecorator`);
  }

  let configNode = rawConfig as any;

  for (const key of configKey.split('.')) {
    if (configNode[key]) {
      configNode = configNode[key];
    } else return {} as T;
  }

  return configNode as T;
}

/**
 * Get a typed and resolved configuration object
 */
export function getConfig<T extends object>(cls: ClassConstructor<T>): T {
  // one config per class and namespace
  const configKey = (cls as any).__config_key;

  if (!configKey) {
    throw new Error(`${cls.name} class missing @ConfigDecorator`);
  }

  const cacheKey = `${configKey}:${cls.name}`;

  if (configCache.has(cacheKey)) {
    return configCache.get(cacheKey);
  }

  const config = plainToValidatedInstance(cls, getRawConfig(cls));
  configCache.set(cacheKey, config);
  return config;
}

/**
 * Factory provider for a configuration class
 *  provides a validated and resolved configuration object
 * @param cls
 */
export function getConfigFactory(cls: any) {
  return {
    provide: cls,
    useFactory: () => getConfig(cls),
  };
}
