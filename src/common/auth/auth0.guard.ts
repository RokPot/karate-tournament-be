import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

/**
 * Auth0 Guard
 * 
 * This guard protects routes by validating Auth0 JWT tokens.
 * 
 * By default, all routes are protected. To make a route public,
 * use the @Public() decorator.
 * 
 * Usage:
 * - Global guard (recommended): Add to APP_GUARD in AppModule
 * - Per-route: Use @UseGuards(Auth0Guard) on specific routes
 */
@Injectable()
export class Auth0Guard extends AuthGuard('auth0') {
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * Check if the route can be activated
   * 
   * If the route is marked as @Public(), allow access without authentication.
   * Otherwise, delegate to the parent AuthGuard to validate the JWT token.
   */
  canActivate(context: ExecutionContext) {
    // Check if route is marked as public using @Public() decorator
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    // If public, allow access without authentication
    if (isPublic) {
      return true;
    }

    // Otherwise, validate the JWT token using the parent guard
    return super.canActivate(context);
  }

  /**
   * Handle the request after authentication
   * 
   * If authentication fails or user is not found, throw UnauthorizedException.
   * Otherwise, return the authenticated user.
   */
  handleRequest(err: any, user: any, info: any) {
    // If there's an error or no user, throw UnauthorizedException
    if (err || !user) {
      throw err || new UnauthorizedException('Authentication required');
    }

    // Return the authenticated user (Auth0Payload)
    return user;
  }
}

