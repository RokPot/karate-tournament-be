import { createScaffolding } from '@povio/scaffold';
import { z } from '@povio/scaffold/dist/plugins/zod';

export default createScaffolding({
  name: 'build',

  configSchema: z.object({
    compiler: z.enum(['swc', 'tsc']).default('tsc'),
  }),

  init: async ({ config }, { addRequest, setStatus }) => {
    if (config!.compiler === 'swc') {
      for (const value of [
        { pkg: '@swc/cli@^0.3.12', dev: true },
        { pkg: '@swc/core@^1.5.27', dev: true },
      ]) {
        await addRequest({
          match: 'package.json:dependency',
          value: {
            state: config!.compiler === 'swc' ? 'installed' : 'missing',
            ...value,
          },
        });
      }
      // todo, set nest-cli.json compilerOptions.builder=swc
    } else {
      setStatus('disabled');
    }
  },
});
