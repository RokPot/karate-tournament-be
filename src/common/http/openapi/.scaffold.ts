import { createScaffolding } from '@povio/scaffold';
import { z } from '@povio/scaffold/dist/plugins/zod';

const OpenApiScaffoldOptions = z.object({
  mode: z.enum(['disabled', 'runtime', 'static']).default('disabled'),
  plugins: z.array(z.enum(['swagger-ui'])).optional(),
});

export type IOpenApiScaffoldOptions = z.infer<typeof OpenApiScaffoldOptions>;

export default createScaffolding({
  name: '~common/http/openapi',

  configSchema: OpenApiScaffoldOptions,

  async init({ config, modules }, { setStatus, addRequest }) {
    const enabled = config!.mode !== 'disabled';

    await addRequest({
      match: 'tsconfig:exclude',
      value: { path: 'src/common/http/openapi', excluded: !enabled, context: '[all]' },
    });

    await addRequest({
      match: 'nest-cli.json:plugin',
      description: 'add swagger plugin',
      value: {
        name: '@nestjs/swagger',
        options: {
          introspectComments: true,
        },
        mode: config!.mode === 'runtime' ? 'enabled' : 'disabled',
      },
    });

    await addRequest({
      match: 'package.json:dependency',
      value: {
        pkg: '@nestjs/swagger@^8.1.1',
        state: enabled ? 'installed' : 'missing',
        dev: config!.mode === 'static',
      },
    });

    if (enabled) {
      await addRequest({
        match: '~app.pipes:activate',
        value: {
          fileImports: [['setupOpenApi', '~common/http/openapi/openapi.middleware']],
          position: 'after-interceptors',
          statement: 'setupOpenApi(app);',
        },
      });
    }

    if (enabled) {
      await addRequest({
        match: 'dot-config:configure',
        value: {
          stage: '[all]',
          state: 'created',
          value: {
            'http.openapi': {
              mode: config!.mode,
              path: 'docs',
              title: modules['project']?.config?.name,
              description: 'API Documentation',
            },
          },
        },
      });
    }

    await addRequest({
      match: 'package.json:value',
      description: 'build openapi script',
      value: {
        path: 'scripts.openapi:build',
        value: 'nest start --config src/common/http/openapi/openapi.tsc.nest-cli.json',
        state: enabled && modules['build']?.config?.compiler === 'tsc' ? 'equals' : 'missing',
      },
    });

    await addRequest({
      match: 'scripts:set',
      value: {
        module: 'build.d',
        state: config?.mode === 'static' ? 'equals' : 'deleted',
        name: '60_openapi.sh',
        value:
          // language=sh
          `# generate openapi.json
yarn openapi:build`,
      },
    });

    if (!enabled) {
      setStatus('disabled');
      return;
    }
  },
});
