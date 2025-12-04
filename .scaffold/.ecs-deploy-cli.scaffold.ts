import { createScaffolding } from '@povio/scaffold';
import { z } from '@povio/scaffold/dist/plugins/zod';
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const queue: { path: string; content: string }[] = [];

export default createScaffolding({
  name: 'ecs-deploy-cli',

  configSchema: z.object({
    mode: z.enum(['disabled', 'enabled', 'purged']).default('disabled'),
    stages: z.array(z.string()).default([]),
    bootstrap: z.boolean().default(true),
  }),

  async init({ config, cwd, modules }, { addMessage, addRequest, addExecutor, setStatus }) {
    if (config!.mode === 'disabled') {
      setStatus('disabled');
      return;
    }

    await addRequest({
      match: 'package.json:dependency',
      value: { pkg: '@povio/ecs-deploy-cli@^4.3.1' },
    });

    const bootstrap = modules['dot-config'] && modules['dot-config'].config!.bootstrap ? false : config!.bootstrap;

    await addRequest({
      match: 'scripts:set',
      value: {
        module: 'bootstrap.d',
        state: bootstrap ? 'equals' : 'deleted',
        name: '10_ecsdeploy.sh',
        // language=sh
        value: `#!/bin/bash

# generate config from ./config/STAGE.ecs-deploy.yml
yarn ecs-deploy bootstrap
`,
      },
    });

    // enable local stage by default
    for (const stage of ['local', 'test']) {
      if (!existsSync(join(cwd, `.config/${stage}.ecs-deploy.yml`))) {
        addMessage('info', `create ${stage} ECS Deploy configuration file`);
        queue.push({
          path: join(cwd, `.config/${stage}.ecs-deploy.yml`),
          content: `# ECS Deploy configuration file for STAGE=${stage}
# @see https://github.com/povio/ecs-deploy-cli/tree/v4?tab=readme-ov-file#configure

# resolved at runtime using \`ecs-deploy config api --stage ${stage}\`
configs:
  - name: api
    region: us-east-1
    destination: ./.config/${stage}.api.resolved.yml
    values:
      - name: "@"
        configFrom: api.template
`,
        });
      }
    }

    // create missing stage files
    for (const stage of config?.stages ?? []) {
      if (existsSync(join(cwd, `.config/${stage}.ecs-deploy.yml`))) {
        continue;
      }

      addMessage('info', `create ${stage} ECS Deploy configuration file`);
      queue.push({
        path: join(cwd, `.config/${stage}.ecs-deploy.yml`),
        content: `# ECS Deploy configuration file for STAGE=${stage}
# @see https://github.com/povio/ecs-deploy-cli/tree/v4?tab=readme-ov-file#configure

accountId: "000000000000"
region: us-east-1
taskFamily: ${stage}-api
serviceName: ${stage}-api
clusterName: ${stage}

# build and upload to ecr with \`ecs-deploy build api --stage ${stage}\`
build:
  - name: api
    repoName: ${stage}-api
    platform: linux/amd64

    # resolved at build time
    environmentValues:
      - name: RELEASE
        valueFrom: "func:release"
      - name: BUILD_TIMESTAMP
        valueFrom: "func:timestamp"

# deploy to ecs with \`ecs-deploy deploy --stage ${stage}\`
taskDefinition:
  - name: default
    template: arn:aws:ssm:::parameter/${stage}/api/task-definition
    containerDefinitions:
      - name: api
        image: api
        environmentValues:
          - name: DEPLOY_TIMESTAMP
            valueFrom: "func:timestamp"

# resolved at runtime using \`ecs-deploy config api --stage dev\`
configs:
  - name: api
    destination: ./.config/${stage}.api.resolved.yml
    values:
      - name: "@"
        configFrom: api.template
`,
      });

      await addRequest({
        match: 'dot-config:configure',
        value: {
          state: 'created',
          stage,
          value: {
            'core.buildAt': '${env:BUILD_TIMESTAMP}',
          },
        },
      });
    }

    await addExecutor({
      match: 'ecs-deploy-cli:#after-all',
      init: async (task) => {
        if (queue.length === 0) {
          task.status = 'disabled';
        }
      },
      exec: async () => {
        for (const { content, path } of queue) {
          writeFileSync(path, content);
        }
      },
    });
  },
});
