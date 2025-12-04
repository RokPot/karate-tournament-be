# Auth0 Authentication

This module provides Auth0 JWT authentication for the tournament application using Passport.js.

## Configuration

Auth0 configuration is managed through the YAML config files in `.config/` directory.

### Local Development

```yaml
auth0:
  domain: your-tenant.auth0.com
  clientId: your-client-id
  clientSecret: your-client-secret
  audience: https://api.tournament-app.com
```

### Production/Staging

```yaml
auth0:
  domain: ${arn:aws:ssm:.../auth0/domain}
  clientId: ${arn:aws:ssm:.../auth0/client-id}
  clientSecret: ${arn:aws:ssm:.../auth0/client-secret}
  audience: ${arn:aws:ssm:.../auth0/audience}
```

## Setup

1. Create an Auth0 account at https://auth0.com
2. Create a new API in Auth0 Dashboard
3. Note your:
   - Domain (e.g., `your-tenant.auth0.com`)
   - Client ID
   - Client Secret
   - API Identifier (Audience)
4. Add these values to your config files

## Usage

### Protecting Routes

By default, **all routes are protected** by the global `Auth0Guard`. 

To make a route public, use the `@Public()` decorator:

```typescript
import { Controller, Get } from '@nestjs/common';
import { Public } from '~common/auth';

@Controller('health')
export class HealthController {
  @Public()
  @Get()
  check() {
    return { status: 'ok' };
  }
}
```

### Accessing User Information

Use decorators to access authenticated user information:

```typescript
import { Controller, Get } from '@nestjs/common';
import { CurrentUser, UserId, Auth0Payload } from '~common/auth';

@Controller('profile')
export class ProfileController {
  @Get()
  getProfile(@CurrentUser() user: Auth0Payload) {
    return {
      id: user.sub,
      email: user.email,
      name: user.name,
    };
  }

  @Get('id')
  getUserId(@UserId() userId: string) {
    return { userId };
  }
}
```

### Manual Guard Usage

If you need to use the guard manually (instead of global):

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { Auth0Guard } from '~common/auth';

@Controller('protected')
@UseGuards(Auth0Guard)
export class ProtectedController {
  @Get()
  protected() {
    return { message: 'This is protected' };
  }
}
```

## Auth0 Payload

The `Auth0Payload` interface includes:

- `sub` - User ID (required)
- `email` - User email
- `email_verified` - Email verification status
- `name` - User's full name
- `nickname` - User's nickname
- `picture` - User's profile picture URL
- `aud` - Audience (API identifier)
- `iss` - Issuer
- `iat` - Issued at timestamp
- `exp` - Expiration timestamp

## Testing

For testing, you can:

1. Use `@Public()` decorator to bypass authentication
2. Mock the `Auth0Guard` in your tests
3. Use Auth0's test tokens for integration tests

## Important Notes

- The guard validates JWT tokens using Auth0's JWKS endpoint
- Tokens are automatically validated for expiration
- The `audience` must match your Auth0 API identifier
- All routes are protected by default unless marked with `@Public()`

