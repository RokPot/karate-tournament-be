import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

import { User } from './user.entity';

/**
 * Current User Entity Decorator
 * 
 * Extracts the User entity from the request (set by UserSyncInterceptor).
 * This returns the full User entity from the database, not just the Auth0Payload.
 * 
 * Usage:
 * ```typescript
 * @Get('profile')
 * getProfile(@CurrentUserEntity() user: User) {
 *   return {
 *     id: user.id,
 *     firstName: user.firstName,
 *     lastName: user.lastName,
 *     club: user.club,
 *   };
 * }
 * ```
 * 
 * Note: This decorator requires UserSyncInterceptor to be registered globally.
 * If the user entity is not found, it will return undefined.
 */
export const CurrentUserEntity = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User | undefined => {
    const request = ctx.switchToHttp().getRequest<Request & { userEntity?: User }>();
    return request.userEntity;
  },
);

