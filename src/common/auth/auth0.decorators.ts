import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

import { Auth0Payload } from './auth0.strategy';

/**
 * Mark a route as public (no authentication required)
 */
export const Public = () => SetMetadata('isPublic', true);

/**
 * Get the authenticated user from the request
 * Usage: @CurrentUser() user: Auth0Payload
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Auth0Payload => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return (request as any).user;
  },
);

/**
 * Get the user ID from the authenticated user
 * Usage: @UserId() userId: string
 */
export const UserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = (request as any).user as Auth0Payload;
    return user?.sub;
  },
);

