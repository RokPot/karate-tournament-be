import { readFileSync } from 'fs';
import { resolve } from 'node:path';

import { type INestApplication } from '@nestjs/common';
import { type Request, type Response } from 'express';
import expressBasicAuth from 'express-basic-auth';

import { getConfig } from '~common/config';

import { OpenApiConfig, OpenApiConfigMode } from './openapi.config';
import { useSwagger } from './openapi.helpers';

const openApiConfig = getConfig(OpenApiConfig);

export function setupOpenApi(app: INestApplication) {
  const basicAuth = expressBasicAuth({
    challenge: true,
    users: {
      [openApiConfig.username]: openApiConfig.password,
    },
  });

  if (openApiConfig.mode === OpenApiConfigMode.runtime) {
    app.use(`/${openApiConfig.path}`, basicAuth);
    useSwagger(app);
  } else if (openApiConfig.mode === OpenApiConfigMode.static) {
    app.use(`/${openApiConfig.path}-json`, basicAuth, (_req: Request, res: Response) => {
      res.json(JSON.parse(readFileSync(resolve(__dirname, '../../../../', 'resources', 'openapi.json'), 'utf-8')));
    });
  }
}
