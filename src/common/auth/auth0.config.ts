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
   * This should match the identifier you set when creating the API in Auth0 Dashboard
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
   * Auth0 tokens typically have the issuer with a trailing slash
   */
  get issuer(): string {
    if (this.issuerBaseUrl) {
      return this.issuerBaseUrl.endsWith('/') ? this.issuerBaseUrl : `${this.issuerBaseUrl}/`;
    }
    return `https://${this.domain}/`;
  }
}

