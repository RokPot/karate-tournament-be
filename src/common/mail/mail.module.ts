import { Module } from '@nestjs/common';

import { getConfigFactory } from '~common/config';

import { MailConfig } from './mail.config';
import { MailService } from './mail.service';

@Module({
  providers: [getConfigFactory(MailConfig), MailService],
  exports: [MailService],
})
export class MailModule {}
