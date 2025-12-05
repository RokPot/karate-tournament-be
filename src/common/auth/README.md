# Auth0 Authentication

This module provides Auth0 JWT authentication for the application using Passport.js, following the [Auth0 NestJS guide](https://auth0.com/blog/developing-a-secure-api-with-nestjs-adding-authorization/).

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
2. Create a new **API** in Auth0 Dashboard:
   - Go to **APIs** → **Create API**
   - Set **Identifier** (this is your `audience` value)
   - Choose **RS256** signing algorithm
3. Note your:
   - **Domain** (e.g., `your-tenant.auth0.com`)
   - **Client ID** (from your Machine-to-Machine application)
   - **Client Secret** (from your Machine-to-Machine application)
   - **API Identifier** (this is your `audience`)
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

### Testing in Swagger

1. **Get an Auth0 token:**
   - Use Auth0 Dashboard → APIs → Your API → Test tab
   - Or use Machine-to-Machine flow to get a token

2. **Open Swagger UI:**
   - Navigate to `http://localhost:3002/docs`
   - Login with your Swagger credentials

3. **Authorize:**
   - Click the **"Authorize"** button (lock icon)
   - Enter your token: `Bearer YOUR_TOKEN` or just `YOUR_TOKEN`
   - Click **Authorize**

4. **Test protected endpoints:**
   - Try `/test/protected` - should work with token
   - Try without token - should return 401

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

## How It Works

1. **Client** authenticates with Auth0 and receives a JWT access token
2. **Client** sends requests with `Authorization: Bearer <token>` header
3. **Auth0Guard** intercepts the request:
   - Checks if route is `@Public()` - if yes, allows access
   - Otherwise, validates the JWT token using `Auth0Strategy`
4. **Auth0Strategy** validates the token:
   - Extracts token from `Authorization` header
   - Fetches public key from Auth0's JWKS endpoint
   - Verifies token signature, audience, and issuer
   - Returns the decoded payload
5. **Controller** receives the authenticated user via `@CurrentUser()` or `@UserId()`

## Important Notes

- The guard validates JWT tokens using Auth0's JWKS endpoint
- Tokens are automatically validated for expiration
- The `audience` must match your Auth0 API identifier
- All routes are protected by default unless marked with `@Public()`
- JWKS keys are cached to improve performance

