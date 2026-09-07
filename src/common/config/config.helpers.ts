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

const ENV_REF_REGEX = /\$\{env:([A-Za-z_][A-Za-z0-9_]*)\}/g;

/**
 * Recursively replace ${env:VAR_NAME} placeholders with process.env values.
 * Used for Railway, local, and test (no bootstrap).
 */
function resolveEnvRefs(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (typeof obj === 'string') {
    return obj.replace(ENV_REF_REGEX, (_, name) => process.env[name] ?? '');
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => resolveEnvRefs(item));
  }
  if (isPlainObject(obj)) {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(obj as object)) {
      out[key] = resolveEnvRefs((obj as Record<string, unknown>)[key]);
    }
    return out;
  }
  return obj;
}

/**
 * Load the raw config from the filesystem
 * do not use directly, use loadConfig with a typed config instead
 *
 * Loads and overrides the config from the following files:
 * - .config/${moduleName}.template.yml
 * - .config/${moduleName}.resolved.yml - optional generated overlay
 * - .config/${moduleName}.yml - legacy
 * - .config/${moduleName}.override.yml - manually created and edited
 *
 * String values matching ${env:VAR_NAME} are replaced with process.env at runtime.
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
  return resolveEnvRefs(config) as Record<string, any>;
}
