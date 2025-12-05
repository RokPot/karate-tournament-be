import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  INestApplication,
} from '@nestjs/common';
import { Observable, from } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';
import { Request } from 'express';

import { Auth0Payload } from '~common/auth';

import { UserService } from './user.service';

/**
 * User Sync Interceptor
 * 
 * Automatically creates User entity from Auth0 payload on first authenticated request.
 * This implements lazy user creation (Option 1).
 * 
 * The interceptor:
 * 1. Checks if route is public (skips if public)
 * 2. Extracts Auth0Payload from request (set by Auth0Guard)
 * 3. Finds or creates User entity by auth0Id
 * 4. Attaches User entity to request object for use in controllers
 */
@Injectable()
export class UserSyncInterceptor implements NestInterceptor {
  private readonly logger = new Logger(UserSyncInterceptor.name);

  constructor(private readonly userService: UserService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request & { user?: Auth0Payload; userEntity?: any }>();

    // Skip if route is public (no Auth0 authentication)
    const isPublic = Reflect.getMetadata('isPublic', context.getHandler()) ||
                     Reflect.getMetadata('isPublic', context.getClass());
    
    if (isPublic) {
      return next.handle();
    }

    // Get Auth0Payload from request (set by Auth0Guard)
    const auth0Payload = request.user as Auth0Payload | undefined;

    if (!auth0Payload || !auth0Payload.sub) {
      // No Auth0 payload - this shouldn't happen if Auth0Guard is working correctly
      // But we'll log and continue to avoid breaking the request
      this.logger.warn('No Auth0 payload found in request, skipping user sync');
      return next.handle();
    }

    // Find or create user from Auth0 payload (async operation)
    return from(this.userService.findOrCreateByAuth0Id(auth0Payload)).pipe(
      tap((userEntity) => {
        // Attach User entity to request for use in controllers
        request.userEntity = userEntity;
        this.logger.debug(`User synced: ${userEntity.id} (auth0Id: ${userEntity.auth0Id})`);
      }),
      switchMap(() => next.handle()),
      // If user sync fails, log error but continue with request
      catchError((error) => {
        this.logger.error(`Failed to sync user from Auth0: ${error.message}`, error.stack);
        // Continue with request even if sync fails
        return next.handle();
      }),
    );
  }
}

/**
 * Register UserSyncInterceptor globally
 * This should be called after Auth0Guard is set up
 */
export function useUserSyncInterceptor(app: INestApplication): void {
  const userService = app.get(UserService);
  app.useGlobalInterceptors(new UserSyncInterceptor(userService));
}
