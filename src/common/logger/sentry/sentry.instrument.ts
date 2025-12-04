import type { Integration } from '@sentry/core';
import { init, type NodeOptions } from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

import { getConfig } from '~common/config';
import { CoreConfig } from '~common/core';

import { SentryConfig } from './sentry.config';

const coreConfig = getConfig(CoreConfig);
const sentryConfig = getConfig(SentryConfig);

if (sentryConfig.dsn) {
  const integrations: Integration[] = [];

  if (sentryConfig.profilesSampleRate > 0) {
    integrations.push(nodeProfilingIntegration());
  }

  /**
   * @see https://docs.sentry.io/platforms/javascript/guides/nestjs/configuration/options
   */
  const config: NodeOptions = {
    dsn: sentryConfig.dsn,
    debug: sentryConfig.debug,

    release: coreConfig.release,
    environment: coreConfig.stage,
    serverName: coreConfig.service,

    sampleRate: sentryConfig.sampleRate,
    tracesSampleRate: sentryConfig.tracesSampleRate,
    profilesSampleRate: sentryConfig.profilesSampleRate,

    integrations: (_integrations) => {
      // Remove default integrations
      return [
        ...integrations,
        ..._integrations.filter((integration) => {
          return integration.name !== 'Console';
        }),
      ];
    },
  };

  // Ensure to call this before importing any other modules!
  init(config);
}
