import { createScaffolding } from '@povio/scaffold';

export default createScaffolding({
  name: '~common/logger/basic',

  async init({ modules }, { addRequest, addExecutor }) {
    await addExecutor({
      match: '~common/logger/basic:activate',
      description: 'install basic logger',
      init: async () => {
        await addRequest({
          match: 'package.json:dependency',
          description: 'install console coloring',
          value: { pkg: 'chalk@^4.1.2' },
        });

        await addRequest({
          match: 'dot-config:configure',
          description: 'inject basic logger configuration into deployment config',
          value: {
            stage: '[deployed]',
            state: 'created',
            value: {
              logger: {
                output: 'json',
                level: 'log',
                contexts: {
                  Bootstrap: 'warn',
                  HttpException: 'warn',
                  ExceptionHandler: 'debug',
                  RoutesResolver: 'warn',
                  RouterExplorer: 'warn',
                  NestApplication: 'warn',
                },
              },
            },
          },
        });

        await addRequest({
          match: 'dot-config:configure',
          description: 'inject basic logger configuration into local config',
          value: {
            stage: '[local]',
            state: 'created',
            value: {
              logger: {
                output: 'console',
                level: 'debug',
                contexts: {
                  Bootstrap: 'log',
                  HttpException: 'warn',
                  ExceptionHandler: 'debug',
                  RoutesResolver: 'log',
                  RouterExplorer: 'log',
                  NestApplication: 'log',
                },
              },
            },
          },
        });

        await addRequest({
          match: '~app.pipes:activate',
          value: {
            fileImports: [['ExpressLoggerMiddleware', '~common/logger/express-logger.middleware']],
            position: 'http',
            statement: 'app.use(ExpressLoggerMiddleware);',
          },
        });
      },
    });

    if (modules['~common/logger']?.config?.provider === 'basic') {
      await addRequest({ match: '~common/logger/basic:activate' });

      await addRequest({
        match: `~common/logger:activate`,
        description: 'inject basic logging globally',
        value: {
          LoggerService: ['BasicLoggerService', './basic/basic-logger.service'],
        },
      });

      return;
    }
  },
});
