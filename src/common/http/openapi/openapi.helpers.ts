import { type INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { getConfig } from '~common/config';
import { CoreConfig } from '~common/core';

import { OpenApiConfig } from './openapi.config';

const openApiConfig = getConfig(OpenApiConfig);
const coreConfig = getConfig(CoreConfig);

export function getSwaggerDocument(app: INestApplication) {
  let config = new DocumentBuilder()
    .setTitle(openApiConfig.title)
    .setDescription(openApiConfig.description)
    .setVersion(coreConfig.version ?? '0.0.0')
    .addBearerAuth(
      {
        name: 'Authorization',
        bearerFormat: 'Bearer',
        scheme: 'Bearer',
        type: 'http',
        in: 'Header',
      },
      'Authorization',
    );

  if (coreConfig.apiBaseUrl) {
    config = config.addServer(coreConfig.apiBaseUrl);
  }

  return SwaggerModule.createDocument(app, config.build());
}

export function useSwagger(app: INestApplication) {
  SwaggerModule.setup(openApiConfig.path, app, getSwaggerDocument(app), {
    swaggerOptions: {
      persistAuthorization: true,
      tryItOutEnabled: true,
    },
  });
}
