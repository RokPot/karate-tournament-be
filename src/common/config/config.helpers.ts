import { cosmiconfigSync } from 'cosmiconfig';

export const hasOwn = Function.prototype.call.bind(Object.prototype.hasOwnProperty);
const objToString = Function.prototype.call.bind(Object.prototype.toString);
function isPlainObject(obj: unknown): boolean {
  return objToString(obj) === '[object Object]';
}
export interface MergeOptions {
  mergeArrays: boolean;
}
function merge(target: any, source: any, options: MergeOptions): any {
  for (const key of Object.keys(source)) {
    const newValue = source[key];
    if (hasOwn(target, key)) {
      if (Array.isArray(target[key]) && Array.isArray(newValue)) {
        if (options.mergeArrays) {
          target[key].push(...newValue);
          continue;
        }
      } else if (isPlainObject(target[key]) && isPlainObject(newValue)) {
        target[key] = merge(target[key], newValue, options);
        continue;
      }
    }
    target[key] = newValue;
  }
  return target;
}

/**
 * Load the raw config from the filesystem
 * do not use directly, use loadConfig with a typed config instead
 *
 * Loads and overrides the config from the following files:
 * - .config/${moduleName}.resolved.yml - generated on bootstrap
 * - .config/${moduleName}.yml - legacy
 * - .config/${moduleName}.override.yml - manually created and edited
 */
export function readConfig(options: { moduleName: string; directory: string }): Record<string, any> {
  let config = {};
  for (const priority of ['.template', '.resolved', '', '.override']) {
    const { search } = cosmiconfigSync(options.moduleName, {
      searchPlaces: ['.json', '.yaml', '.yml', '.js', '.ts', '.cjs'].map(
        (ext) => `${options.moduleName}${priority}${ext}`,
      ),
      // stopDir: options.directory, // only search one folder
    });
    const result = search(options.directory);
    if (result && result.filepath && !result.isEmpty) {
      config = merge(config, result.config, { mergeArrays: false });
    }
  }
  if (Object.keys(config).length < 1) {
    throw new Error(`No config or fallback found: ${options.directory}${options.moduleName}.[resolved|override].yml`);
  }
  return config;
}
