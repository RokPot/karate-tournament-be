import { Module, Global } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { getConfigFactory } from '~common/config';

import { Auth0Config } from './auth0.config';
import { Auth0Strategy } from './auth0.strategy';
import { Auth0Guard } from './auth0.guard';

/**
 * Auth0 Module
 * 
 * Provides Auth0 JWT authentication for the application.
 * 
 * This module is marked as @Global() so it can be used throughout the app
 * without importing it in every module.
 * 
 * To use Auth0 authentication:
 * 1. Configure Auth0 in your config file (.config/*.api.template.yml)
 * 2. Add Auth0Guard as a global guard in AppModule (recommended)
 * 3. Use @Public() decorator on routes that should be accessible without auth
 * 4. Use @CurrentUser() or @UserId() decorators to access user info in controllers
 */
@Global()
@Module({
  imports: [
    // Register Passport with the 'auth0' strategy
    PassportModule.register({ defaultStrategy: 'auth0' }),
  ],
  providers: [
    // Provide Auth0Config from config files
    getConfigFactory(Auth0Config),
    // Provide Auth0Strategy for JWT validation
    Auth0Strategy,
    // Provide Auth0Guard for route protection
    Auth0Guard,
  ],
  exports: [
    // Export guard and PassportModule for use in other modules
    Auth0Guard,
    PassportModule,
  ],
})
export class Auth0Module {}

