import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

import { Auth0Payload } from './auth0.strategy';

/**
 * Public Route Decorator
 * 
 * Marks a route as public, bypassing Auth0 authentication.
 * 
 * Usage:
 * ```typescript
 * @Public()
 * @Get('health')
 * check() {
 *   return { status: 'ok' };
 * }
 * ```
 */
export const Public = () => SetMetadata('isPublic', true);

/**
 * Current User Decorator
 * 
 * Extracts the authenticated user from the request.
 * The user object contains the Auth0 JWT payload.
 * 
 * Usage:
 * ```typescript
 * @Get('profile')
 * getProfile(@CurrentUser() user: Auth0Payload) {
 *   return {
 *     id: user.sub,
 *     email: user.email,
 *     name: user.name,
 *   };
 * }
 * ```
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Auth0Payload => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return (request as any).user;
  },
);

/**
 * User ID Decorator
 * 
 * Extracts the user ID (subject) from the authenticated user.
 * 
 * Usage:
 * ```typescript
 * @Get('my-data')
 * getMyData(@UserId() userId: string) {
 *   return this.service.findByUserId(userId);
 * }
 * ```
 */
export const UserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = (request as any).user as Auth0Payload;
    return user?.sub;
  },
);

