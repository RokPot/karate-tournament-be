import { Expose, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, ValidateIf } from 'class-validator';

import { ConfigDecorator } from '~common/config';
import { TransformInputToBoolean } from '~common/validate';

@ConfigDecorator('mail')
export class MailConfig {
  @Expose()
  @IsBoolean()
  @TransformInputToBoolean()
  enabled: boolean = false;

  @Expose()
  @IsString()
  host: string = 'smtp-relay.brevo.com';

  @Expose()
  @IsInt()
  @Type(() => Number)
  port: number = 587;

  /**
   * Brevo SMTP login (used when apiKey is not set).
   */
  @Expose()
  @IsString()
  @IsOptional()
  user?: string;

  /**
   * Brevo SMTP key (used when apiKey is not set).
   */
  @Expose()
  @IsString()
  @IsOptional()
  password?: string;

  /**
   * Brevo API key (preferred on Railway — HTTPS, avoids SMTP port blocks).
   * Create under Settings → SMTP & API → API keys (not the SMTP key).
   */
  @Expose()
  @IsString()
  @IsOptional()
  @ValidateIf((o: MailConfig) => o.enabled)
  apiKey?: string;

  @Expose()
  @IsString()
  @IsOptional()
  @ValidateIf((o: MailConfig) => o.enabled)
  from?: string;

  /**
   * Disable TLS certificate verification for SMTP (local/dev only).
   * Use when a proxy or antivirus injects a self-signed cert into the chain.
   */
  @Expose()
  @IsBoolean()
  @IsOptional()
  @TransformInputToBoolean()
  tlsInsecure?: boolean;
}
