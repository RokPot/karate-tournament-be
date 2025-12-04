import { createScaffolding } from '@povio/scaffold';
import { readFileSync, writeFileSync } from 'node:fs';

const tsConfig: Record<
  string,
  {
    save: boolean;
    path: string;
    data: { exclude: string[] };
  }
> = {};

export default createScaffolding({
  name: 'tsconfig',

  init: async ({ cwd }, { addExecutor }) => {
    await addExecutor({
      match: 'tsconfig:exclude',
      description: 'manage tsconfig exclude',
      init: async (task, { addMessage }) => {
        const { context, path, excluded } = task.request.value!;
        const doit = (tsConfigPath: string, context: string) => {
          if (!tsConfig[context]) {
            tsConfig[context] = {
              save: false,
              path: `${cwd}/${tsConfigPath}`,
              data: JSON.parse(readFileSync(`${cwd}/${tsConfigPath}`, 'utf-8')),
            };
          }
          if (excluded && !tsConfig[context].data.exclude.includes(path)) {
            tsConfig[context].data.exclude.push(path);
            tsConfig[context].save = true;
            addMessage('info', `tsconfig${context === 'default' ? '' : '.' + context}.json exclude ${path}`);
            task.status = 'delegated';
            return;
          }
          if (!excluded && tsConfig[context].data.exclude.includes(path)) {
            tsConfig[context].data.exclude = tsConfig[context].data.exclude.filter((p) => p !== path);
            addMessage('info', `tsconfig.json un-exclude ${path}`);
            tsConfig[context].save = true;
            task.status = 'delegated';
            return;
          }
        };
        switch (context) {
          case 'default':
            doit(`tsconfig.json`, context);
            break;
          case 'build':
            doit(`tsconfig.${context}.json`, context);
            break;
          case '[all]':
            doit(`tsconfig.json`, context);
            doit(`tsconfig.build.json`, 'build');
            break;
        }
      },
    });

    await addExecutor({
      match: 'tsconfig:#after-all',
      description: 'save tsconfig files',
      init: async (task) => {
        if (!Object.values(tsConfig).some((c) => c.save)) {
          task.status = 'disabled';
        }
      },
      exec: async () => {
        for (const { save, path, data } of Object.values(tsConfig)) {
          if (save) {
            writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
          }
        }
      },
    });
  },
});
