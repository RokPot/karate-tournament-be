import { HttpStatus, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import { describe, beforeAll, it } from 'vitest';

import { createBaseTestingModule } from '~test/utils/base.testing-module';

import { HttpHealthModule } from './http-health.module';

describe('HttpHealth', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createBaseTestingModule({
      imports: [HttpHealthModule],
    });
  });

  it('should return health status', async ({ expect }) => {
    expect((await request(app.getHttpServer()).get('/')).status).toBe(HttpStatus.OK);
  });
});
