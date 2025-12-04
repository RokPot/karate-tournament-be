import { createScaffolding } from '@povio/scaffold';
import lodash from '@povio/scaffold/dist/plugins/lodash';
import { satisfies } from '@povio/scaffold/dist/plugins/semver';
import { z } from '@povio/scaffold/dist/plugins/zod';
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

export default createScaffolding({
  name: 'package.json',

  configSchema: z.object({
    install: z.string().default('yarn install'),
  }),

  init: async ({ cwd, config }, { addExecutor }) => {
    const packageJson = JSON.parse(readFileSync(`${cwd}/package.json`, 'utf-8'));
    let save: boolean = false;

    await addExecutor({
      match: 'package.json:dependency',
      init: async (task, { addMessage }) => {
        const { pkg, dev, state } = task.request.value!;
        if (!pkg) {
          addMessage('error', `pkg is required for dependency installation`);
          task.status = 'errored';
          return;
        }
        let changes = false;
        const match = pkg.match(/^(?<pkg>@?[^@]+)(?:@(?<version>.+))?/);
        if (!match) {
          addMessage('error', `Invalid package name ${pkg}`);
          task.status = 'errored';
          return;
        }
        const {
          groups: { pkg: name, version },
        } = match;

        switch (state) {
          case undefined:
          case 'installed': {
            const installedVersion = packageJson.dependencies?.[name] || packageJson.devDependencies?.[name];
            if (!installedVersion) {

              const installVersion = version || '*';

              if (dev) {
                packageJson.devDependencies[name] = installVersion;
              } else {
                packageJson.dependencies = { ...packageJson.dependencies, [name]: installVersion };
              }
              changes = true;
              task.description = `install ${name}@${installVersion}`;
            } else {
              if (version && installedVersion !== version && !satisfies(installedVersion, version)) {
                addMessage('warning', `Version mismatch for ${name}: ${installedVersion} !== ${version}`);
                // do not error out
              }
            }
            break;
          }
          case 'missing': {
            if (packageJson.dependencies?.[name] || packageJson.devDependencies?.[name]) {
              addMessage('warning', `Package ${name} is installed but should not be`);
            }
            break;
          }
          default:
            addMessage('error', `Invalid state ${state}`);
            task.status = 'errored';
            return;
        }
        if (changes) {
          save = true;
          task.status = 'delegated';
        }
      },
    });

    await addExecutor({
      match: 'package.json:value',
      init: async (task, { addMessage }) => {
        const { path, value, state } = task.request.value!;
        if (!path) {
          addMessage('error', `path is required to manipulate package.json value`);
          task.status = 'errored';
          return;
        }
        let changes = false;
        switch (state) {
          case 'equals': {
            if (!lodash.isEqual(lodash.get(packageJson, path), value)) {
              lodash.set(packageJson, path, value);
              changes = true;
              task.description = `setting ${path}`;
            }
            break;
          }
          case 'subset': {
            const current = lodash.get(packageJson, path);
            if (!current || !lodash.isMatch(current, value)) {
              lodash.set(packageJson, path, lodash.merge({}, current, value));
              task.description = `merging into ${path}`;
              changes = true;
            }
            break;
          }
          case 'missing': {
            if (lodash.get(packageJson, path)) {
              lodash.unset(packageJson, path);
              addMessage('info', `Removing ${path}`);
              task.description = `removing ${path}`;
              changes = true;
            }
            break;
          }
        }
        if (changes) {
          save = true;
          task.status = 'delegated';
        }
      },
    });

    await addExecutor({
      match: 'package.json:#after-all',
      priority: 80,
      init: async (task) => {
        if (!save) {
          task.status = 'disabled';
        }
      },
      exec: async () => {
        if (save) {
          writeFileSync(`${cwd}/package.json`, JSON.stringify(packageJson, null, 2));
          if (config?.install) {
            await new Promise((resolve, reject) => {
              const [command, ...args] = config.install.split(' ');
              const install = spawn(command, args, { cwd });
              install.stdout.setEncoding('utf8').on('data', console.log);
              install.stderr.setEncoding('utf8').on('data', console.error);
              install.on('exit', resolve);
              install.on('error', reject);
            });
          }
        }
      },
    });
  },
});
