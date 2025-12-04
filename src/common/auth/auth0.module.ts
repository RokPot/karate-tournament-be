import { Module, Global } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { getConfigFactory } from '~common/config';

import { Auth0Config } from './auth0.config';
import { Auth0Strategy } from './auth0.strategy';
import { Auth0Guard } from './auth0.guard';

@Global()
@Module({
  imports: [PassportModule.register({ defaultStrategy: 'auth0' })],
  providers: [
    getConfigFactory(Auth0Config),
    Auth0Strategy,
    Auth0Guard,
  ],
  exports: [Auth0Guard, PassportModule],
})
export class Auth0Module {}

