#!/usr/bin/env node
/**
 *  Build OpenAPI spec from the API controllers
 *
 *  yarn tsx src/common/http/openapi/scripts/openapi.tsc.build.ts
 */

import 'reflect-metadata';

import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { NestFactory } from '@nestjs/core';
import yaml from 'yaml';

// eslint-disable-next-line import/no-restricted-paths
import { AppModule } from '~app.module';

import { getSwaggerDocument } from './openapi.helpers';

const openApiJsonPath = resolve(__dirname, '../../../../', 'resources', 'openapi.yaml');

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: false,
  });

  const document = getSwaggerDocument(app);

  // eslint-disable-next-line no-console
  console.log(`>>> creating ${openApiJsonPath}`);

  writeFileSync(openApiJsonPath, yaml.stringify(document));

  await app.close();
}

bootstrap().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
