import { ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

import { Auth0Config } from './auth0.config';

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
  private readonly logger = new Logger(Auth0Guard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly auth0Config: Auth0Config,
  ) {
    super();
  }

  /**
   * Check if the route can be activated
   *
   * If the route is marked as @Public(), allow access without authentication.
   * Otherwise, delegate to the parent AuthGuard to validate the JWT token.
   */
  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [context.getHandler(), context.getClass()]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  /**
   * Handle the request after authentication
   *
   * If authentication fails or user is not found, throw UnauthorizedException.
   * Otherwise, return the authenticated user.
   */
  handleRequest<TUser = any>(err: any, user: any, info: any, context: ExecutionContext, status?: any): TUser {
    if (err || !user) {
      const request = context.switchToHttp().getRequest<Request>();
      const hasBearer = /^Bearer\s+\S+/i.test(request.get('authorization') ?? '');
      const failure = this.describeAuthFailure(err, info, status);

      this.logger.warn(
        `Auth0 JWT rejected: ${request.method} ${request.originalUrl} ` +
          `bearerPresent=${hasBearer} ${failure} ` +
          `(api audience=${this.auth0Config.audience ?? '(unset)'} issuer=${this.auth0Config.issuer})` +
          JSON.stringify(err),
      );

      if (err) {
        throw err instanceof UnauthorizedException
          ? err
          : new UnauthorizedException('Authentication required', { cause: err });
      }

      throw new UnauthorizedException('Authentication required');
    }

    return user as TUser;
  }

  private describeAuthFailure(err: unknown, info: unknown, status: unknown): string {
    const parts: string[] = [];

    if (err instanceof Error && err.message) {
      parts.push(`error="${err.message}"`);
    } else if (typeof err === 'string' && err) {
      parts.push(`error="${err}"`);
    }

    if (info != null) {
      if (typeof info === 'string') {
        parts.push(`info="${info}"`);
      } else if (typeof info === 'object') {
        const o = info as { message?: string; name?: string };
        if (o.message || o.name) {
          parts.push(`info="${[o.name, o.message].filter(Boolean).join(': ')}"`);
        }
      }
    }

    if (status !== undefined && status !== null && status !== false) {
      parts.push(`passportStatus=${String(status)}`);
    }

    return parts.join(' ') || 'reason=missing_or_invalid_token';
  }
}
