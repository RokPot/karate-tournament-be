import { createScaffolding } from '@povio/scaffold';

export default createScaffolding({
  name: '~common/http',

  async init(_, { addRequest }) {
    for (const value of [
      { pkg: '@types/express@^4.17.21', dev: true },
      { pkg: '@nestjs/platform-express@^10.4.15' },
      { pkg: 'luxon@^3.5.0' },
      { pkg: '@types/luxon@^3.4.2', dev: true },
    ]) {
      await addRequest({
        match: 'package.json:dependency',
        value,
      });
    }

    // request-ip
    for (const value of [{ pkg: 'request-ip@^3.3.0' }, { pkg: '@types/request-ip@^0.0.41', dev: true }]) {
      await addRequest({ match: 'package.json:dependency', value });
    }

    await addRequest({
      priority: 100,
      match: 'dot-config:configure',
      value: {
        stage: '[deployed]',
        state: 'created',
        value: {
          'http.port': '${env:PORT}',
          'http.host': '0.0.0.0',
          'http.log': true,
          'http.validateResponse': 'warn',
          'http.cors': {
            origin: true,
          },
        },
      },
    });
    await addRequest({
      match: 'dot-config:configure',
      value: {
        stage: '[local]',
        state: 'created',
        value: {
          'http.port': 3000,
          'http.host': '0.0.0.0',
          'http.log': true,
          'http.validateResponse': 'warn',
          'http.cors': {
            origin: true,
          },
        },
      },
    });
  },
});
