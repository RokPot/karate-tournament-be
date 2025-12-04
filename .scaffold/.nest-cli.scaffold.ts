import { createScaffolding } from '@povio/scaffold';
import { z } from '@povio/scaffold/dist/plugins/zod';
import { readFileSync, writeFileSync } from 'node:fs';

const NestCliJsonPluginOptions = z.object({
  mode: z.enum(['disabled', 'enabled']).default('enabled'),
  name: z.string(),
  options: z.any(),
});

export type INestCliJsonPluginOptions = z.infer<typeof NestCliJsonPluginOptions>;

export default createScaffolding({
  name: 'nest-cli.json',
  init: async ({ cwd }, { addExecutor }) => {
    let nestCliJson: { compilerOptions?: { plugins?: Array<{ name: string; options: any } | string> } };
    let save: boolean = false;

    await addExecutor({
      match: 'nest-cli.json:plugin',
      init: async (task, { addMessage }) => {
        const value = task.request.value!;
        const { mode, name, options } = NestCliJsonPluginOptions.parse(value);

        if (!nestCliJson) {
          try {
            nestCliJson = JSON.parse(readFileSync(`${cwd}/nest-cli.json`, 'utf-8'));
          } catch (error: any) {
            task.status = 'disabled';
            if (mode !== 'disabled') {
              addMessage('warning', `Failed to read nest-cli.json: ${error.message}`, error);
            }
            return;
          }
        }

        const isThis = (plugin: string | { name: string }) =>
          typeof plugin === 'string' ? plugin === name : plugin.name === name;

        if (nestCliJson.compilerOptions?.plugins && nestCliJson.compilerOptions.plugins.some(isThis)) {
          if (mode === 'disabled') {
            nestCliJson.compilerOptions.plugins = nestCliJson.compilerOptions.plugins.filter(
              (plugin) => !isThis(plugin),
            );
            task.description = `removing NestCLI plugin ${name}`;
            task.status = 'delegated';
            save = true;
            return;
          }
        } else if (mode === 'enabled') {
          if (!nestCliJson.compilerOptions) nestCliJson.compilerOptions = {};
          if (!nestCliJson.compilerOptions.plugins) nestCliJson.compilerOptions.plugins = [];
          nestCliJson.compilerOptions.plugins.push({ name, options });
          task.description = `adding plugin ${name}`;
          task.status = 'delegated';
          save = true;
          return;
        }
        task.status = 'disabled';
      },
    });

    await addExecutor({
      match: 'nest-cli.json:#after-all',
      init: async (task) => {
        if (!save) {
          task.status = 'disabled';
        }
      },
      exec: async () => {
        if (save) {
          writeFileSync(`${cwd}/nest-cli.json`, JSON.stringify(nestCliJson, null, 2));
        }
      },
    });
  },
});
