import { Expose } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

import { ConfigDecorator } from '~common/config';

@ConfigDecorator('auth0')
export class Auth0Config {
  /**
   * Auth0 Domain (e.g., your-tenant.auth0.com)
   */
  @Expose()
  @IsString()
  domain!: string;

  /**
   * Auth0 Client ID
   */
  @Expose()
  @IsString()
  clientId!: string;

  /**
   * Auth0 Client Secret
   */
  @Expose()
  @IsString()
  clientSecret!: string;

  /**
   * Auth0 Audience (API Identifier)
   * Optional, but recommended for API authentication
   */
  @Expose()
  @IsOptional()
  @IsString()
  audience?: string;

  /**
   * Auth0 Issuer Base URL
   * Defaults to https://{domain}
   */
  @Expose()
  @IsOptional()
  @IsString()
  issuerBaseUrl?: string;

  /**
   * Get the issuer base URL
   */
  get issuer(): string {
    return this.issuerBaseUrl || `https://${this.domain}`;
  }
}
