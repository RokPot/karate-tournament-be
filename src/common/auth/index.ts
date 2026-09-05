/**
 * Auth0 Authentication Module
 * 
 * Provides JWT-based authentication using Auth0.
 * 
 * All routes are protected by default. Use @Public() to make routes accessible without authentication.
 */

export * from './auth0.config';
export * from './auth0.strategy';
export * from './auth0.guard';
export * from './auth0.decorators';
export * from './auth0.module';
export * from './roles';
export * from './authorization';

