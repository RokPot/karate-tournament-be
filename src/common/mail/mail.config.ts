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

  @Expose()
  @IsString()
  @IsOptional()
  @ValidateIf((o: MailConfig) => o.enabled)
  user?: string;

  @Expose()
  @IsString()
  @IsOptional()
  @ValidateIf((o: MailConfig) => o.enabled)
  password?: string;

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
