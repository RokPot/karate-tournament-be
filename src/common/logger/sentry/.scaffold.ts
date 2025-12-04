import { createScaffolding } from '@povio/scaffold';

export default createScaffolding({
  name: '~common/logger/sentry',

  async init({ modules }, { addRequest, setStatus }) {
    const provider = modules['~common/logger']?.config?.provider;

    await addRequest({
      match: 'tsconfig:exclude',
      value: { path: 'src/common/logger/sentry', excluded: provider !== 'sentry', context: '[all]' },
    });

    if (provider !== 'sentry') {
      setStatus('disabled');
      return;
    }

    await addRequest({ match: '~common/logger/basic:activate' });

    await addRequest({
      match: `~common/logger:activate`,
      description: 'inject sentry logging globally',
      value: {
        LoggerService: ['SentryLoggerService', './sentry/sentry-logger.service'],
      },
    });

    for (const value of [
      { pkg: '@sentry/nestjs@^8.22.0' },
      { pkg: '@sentry/types@^8.22.0' },
      { pkg: '@sentry/profiling-node@^8.22.0' },
    ]) {
      await addRequest({
        match: 'package.json:dependency',
        value,
      });
    }

    // inject instrumentation
    await addRequest({
      match: '~main:activate',
      description: 'instrument sentry',
      value: {
        position: 'instrumentation',
        statement: "import './common/logger/sentry/sentry.instrument';",
      },
    });

    // inject Module
    await addRequest({
      match: 'nest-module:activate',
      description: 'activate sentry module',
      value: {
        module: 'AppModule',
        fileImports: [['SentryModule', '@sentry/nestjs/setup']],
        imports: ['SentryModule'],
      },
    });

    // Inject Error Handling Override
    //  This is a limitation of the current Sentry Nestjs implementation
    //  We inject before the default error handler so that it overrides it
    //  https://github.com/getsentry/sentry-javascript/issues/12351#issuecomment-2148570260
    // todo

    await addRequest({
      match: 'dot-config:configure',
      description: 'inject sentry into deployment config',
      value: {
        stage: '[deployed]',
        state: 'created',
        value: {
          'logger.sentry': {
            dsn: false,
            level: 'none',
            contexts: {
              Bootstrap: 'none',
              HttpException: 'error',
              ExceptionHandler: 'debug',
              RoutesResolver: 'none',
              RouterExplorer: 'none',
              NestApplication: 'none',
            },
          },
        },
      },
    });
  },
});
