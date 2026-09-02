import * as https from 'node:https';

import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { passportJwtSecret } from 'jwks-rsa';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { Auth0Config } from './auth0.config';

/**
 * Auth0 JWT Payload interface
 * Contains the standard claims from Auth0 tokens
 */
export interface Auth0Payload {
  /** User ID (subject) - required */
  sub: string;
  /** User email */
  email?: string;
  /** Email verification status */
  email_verified?: boolean;
  /** User's full name */
  name?: string;
  /** User's nickname */
  nickname?: string;
  /** User's profile picture URL */
  picture?: string;
  /** Audience (API identifier) */
  aud?: string | string[];
  /** Issuer */
  iss?: string;
  /** Issued at timestamp */
  iat?: number;
  /** Expiration timestamp */
  exp?: number;
  /** Additional custom claims */
  [key: string]: any;
}

/**
 * Auth0 JWT Strategy
 * Validates JWT tokens from Auth0 using JWKS (JSON Web Key Set)
 *
 * This strategy:
 * - Extracts JWT from Authorization header as Bearer token
 * - Validates token signature using Auth0's JWKS endpoint
 * - Verifies audience and issuer match Auth0 configuration
 * - Returns the decoded payload for use in guards and controllers
 */
@Injectable()
export class Auth0Strategy extends PassportStrategy(Strategy, 'auth0') {
  constructor(private readonly config: Auth0Config) {
    const jwksUri = `${config.issuer.replace(/\/$/, '')}/.well-known/jwks.json`;
    const log = new Logger(Auth0Strategy.name);

    if (config.jwksTlsInsecure) {
      log.warn(
        'auth0.jwksTlsInsecure=true: JWKS HTTPS certificate verification is disabled. Use only on trusted dev machines.',
      );
    }

    super({
      // Extract JWT from Authorization header: "Bearer <token>"
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      // Don't ignore token expiration
      ignoreExpiration: false,

      // Verify the audience matches the API identifier
      audience: config.audience,

      // Verify the issuer matches Auth0 domain
      issuer: config.issuer,

      // Use RS256 algorithm (Auth0's default)
      algorithms: ['RS256'],

      // Use JWKS to get the public key for token verification
      // This allows Auth0 to rotate keys without breaking your API
      secretOrKeyProvider: passportJwtSecret({
        cache: true, // Cache the JWKS to avoid repeated requests
        rateLimit: true, // Rate limit JWKS requests
        jwksRequestsPerMinute: 5, // Max 5 requests per minute
        jwksUri,
        ...(config.jwksTlsInsecure ? { requestAgent: new https.Agent({ rejectUnauthorized: false }) } : {}),
      }),
    });
  }

  /**
   * Validate the JWT payload
   * This method is called after the token is verified
   *
   * @param payload - The decoded JWT payload
   * @returns The validated payload (or throws if invalid)
   */
  async validate(payload: Auth0Payload): Promise<Auth0Payload> {
    // Ensure the payload has a subject (user ID)
    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // Return the payload to be attached to the request
    return payload;
  }
}
