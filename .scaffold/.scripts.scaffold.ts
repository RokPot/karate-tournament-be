import { createScaffolding } from '@povio/scaffold';
import { writeFileSync, existsSync, readFileSync, unlinkSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

export default createScaffolding({
  name: 'scripts',

  init: async ({ cwd }, { addExecutor }) => {
    const scriptsRoot = join(cwd, 'scripts');

    await addExecutor({
      match: 'scripts:set',
      description: 'update lifecycle script',
      init: async (task, { addMessage }) => {
        const { module, name, state, value } = task.request.value!;

        if (!module || !name || !state) {
          addMessage('error', `module, name and state are required for lifecycle script creation`);
          task.status = 'errored';
          return;
        }

        let scriptPath = join(scriptsRoot, module);
        if (!existsSync(scriptPath)) {
          mkdirSync(scriptPath, { recursive: true });
        }
        scriptPath = join(scriptPath, name);
        switch (state) {
          case 'created':
            if (!existsSync(scriptPath)) {
              addMessage('info', `create lifecycle script ${module}/${name}`);
              task.status = 'queued';
            }
            break;
          case 'deleted':
            if (existsSync(scriptPath)) {
              addMessage('info', `delete lifecycle script ${module}/${name}`);
              task.status = 'queued';
            }
            break;
          case 'equals':
            if (!existsSync(scriptPath) || readFileSync(scriptPath, 'utf-8') !== value) {
              addMessage('info', `restore lifecycle script ${module}/${name}`);
              task.status = 'queued';
            }
            break;
        }
        if (task.status !== 'queued') {
          task.status = 'conforming';
        }
      },
      exec: async (task, { addMessage }) => {
        const { module, name, state, value } = task.request.value!;
        switch (state) {
          case 'created':
          case 'equals':
            addMessage('info', `creating lifecycle script ${module}/${name}`);
            writeFileSync(join(scriptsRoot, module, name), value || '');
            break;
          case 'deleted':
            addMessage('info', `deleting lifecycle script ${module}/${name}`);
            unlinkSync(join(scriptsRoot, module, name));
            break;
        }
      },
    });
  },
});
