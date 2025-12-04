import { Module } from '@nestjs/common';

import { getConfigFactory } from '~common/config';
import { CoreConfig } from '~common/core';

import { HttpHealthController } from './http-health.controller';

@Module({
  controllers: [HttpHealthController],
  providers: [getConfigFactory(CoreConfig)],
})
export class HttpHealthModule {}
