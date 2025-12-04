import { createScaffolding } from '@povio/scaffold';
import { parseDocument, type Document } from '@povio/scaffold/dist/plugins/yaml';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

interface YamlFile {
  save: boolean;
  path: string;
  name: string;
  variant?: string;
  yaml: Document.Parsed;
}

const files: Record<string, YamlFile> = {};

function getConfigYaml(cwd: string, variant: string, extras: { name: string }) {
  const name = `${variant ? `${variant}.` : ''}compose.yml`;
  const projectName = variant ? `${extras.name}-${variant}` : extras.name;
  if (!files[name]) {
    const path = join(cwd, name);
    const yaml = parseDocument(existsSync(path) ? readFileSync(path, 'utf-8') : `name: ${projectName}`, {
      prettyErrors: true,
      merge: true,
      keepSourceTokens: true,
    });
    files[name] = { save: false, path, yaml, name, variant };
  }
  return files[name];
}

export default createScaffolding({
  name: 'docker-compose',

  init: async ({ cwd, modules }, { addExecutor }) => {
    await addExecutor({
      match: 'docker-compose:configure',
      description: 'update compose.yml',
      init: async (task, { addMessage }) => {
        const { value, variant, state } = task.request.value!;

        if (!state || !value) {
          task.status = 'errored';
          addMessage('error', `state and value are required for compose.yml creation`);
          return;
        }

        task.description = `update ${variant ? `${variant}.` : ''}compose.yml`;

        const file = getConfigYaml(cwd, variant, {
          name: modules.project?.config?.name ?? 'myapp',
        });

        switch (state) {
          case 'created':
            for (const [k, v] of Object.entries(value)) {
              if (!file.yaml.hasIn(k.split('.'))) {
                file.yaml.addIn(k.split('.'), v);
                file.save = true;
                addMessage('info', `${file.name} => create ${k} section`);
                task.status = 'delegated';
              }
            }
            break;
        }
      },
    });

    await addExecutor({
      match: 'docker-compose:#after-all',
      description: 'save compose.yml',
      init: async (task) => {
        if (!Object.values(files).some((f) => f.save)) {
          task.status = 'disabled';
        }
      },
      exec: async () => {
        Object.values(files)
          .filter((f) => f.save)
          .forEach(({ path, yaml }) => writeFileSync(path, yaml.toString()));
      },
    });
  },
});
