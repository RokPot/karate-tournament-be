import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import nodemailer, { type Transporter } from 'nodemailer';

import { MailConfig } from './mail.config';
import { buildInvitationEmail, buildRegistrationConfirmationEmail } from './mail.templates';
import type { SendInvitationEmailParams, SendRegistrationConfirmationParams } from './mail.types';

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly mailConfig: MailConfig) {}

  onModuleInit(): void {
    const { enabled, host, port, user, password, from, tlsInsecure } = this.mailConfig;
    this.logger.log(
      `Mail config: enabled=${enabled} host=${host} port=${port} user=${user ? 'set' : 'missing'} password=${password ? 'set' : 'missing'} from=${from ? 'set' : 'missing'} tlsInsecure=${Boolean(tlsInsecure)}`,
    );
    if (tlsInsecure) {
      this.logger.warn(
        'mail.tlsInsecure=true: SMTP TLS certificate verification is disabled. Use only on trusted dev machines.',
      );
    }
    if (enabled && (!user || !password || !from)) {
      this.logger.warn('Mail is enabled but user/password/from is incomplete — sends will be skipped.');
    }
    if (!enabled) {
      this.logger.warn('Mail is disabled (mail.enabled=false) — invitation and registration emails will not be sent.');
    }
  }

  /**
   * Queue invitation email in the background. Resolves immediately; SMTP runs after the HTTP response.
   */
  async sendInvitation(params: SendInvitationEmailParams): Promise<void> {
    this.logger.log(`Queue invitation email to=${params.to} club=${params.clubName}`);
    this.enqueue(`invitation to ${params.to}`, async () => {
      this.logger.log(`Building invitation email to=${params.to}`);
      const content = buildInvitationEmail(params);
      await this.send({
        to: params.to,
        subject: content.subject,
        html: content.html,
        text: content.text,
      });
    });
  }

  /**
   * Queue registration confirmation in the background. Resolves immediately; SMTP runs after the HTTP response.
   */
  async sendRegistrationConfirmation(params: SendRegistrationConfirmationParams): Promise<void> {
    if (params.registrations.length < 1) {
      this.logger.warn(`Skip registration email to=${params.to}: no registrations to include`);
      return;
    }
    this.logger.log(
      `Queue registration email to=${params.to} count=${params.registrations.length} tournament=${params.tournamentName ?? 'n/a'}`,
    );
    this.enqueue(`registration confirmation to ${params.to}`, async () => {
      this.logger.log(`Building registration email to=${params.to}`);
      const content = buildRegistrationConfirmationEmail(params);
      await this.send({
        to: params.to,
        subject: content.subject,
        html: content.html,
        text: content.text,
      });
    });
  }

  private enqueue(label: string, work: () => Promise<void>): void {
    setImmediate(() => {
      void work().catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(`Background mail failed (${label}): ${message}`);
      });
    });
  }

  private async send(params: { to: string; subject: string; html: string; text: string }): Promise<void> {
    if (!this.mailConfig.enabled) {
      this.logger.warn(`Mail disabled; skipped "${params.subject}" to ${params.to}`);
      return;
    }

    const { user, password, from, host, port } = this.mailConfig;
    if (!user || !password || !from) {
      this.logger.warn(
        `Mail enabled but user/password/from incomplete; skipped "${params.subject}" to ${params.to} (user=${user ? 'set' : 'missing'} password=${password ? 'set' : 'missing'} from=${from ? 'set' : 'missing'})`,
      );
      return;
    }

    this.logger.log(`Sending "${params.subject}" to ${params.to} via ${host}:${port}`);
    try {
      const transporter = this.getTransporter();
      const info = await transporter.sendMail({
        from,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
      });
      this.logger.log(
        `Sent "${params.subject}" to ${params.to} via ${host}:${port} messageId=${info.messageId ?? 'n/a'} response=${info.response ?? 'n/a'}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to send "${params.subject}" to ${params.to}: ${message}`);
    }
  }

  private getTransporter(): Transporter {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: this.mailConfig.host,
        port: this.mailConfig.port,
        secure: this.mailConfig.port === 465,
        auth: {
          user: this.mailConfig.user,
          pass: this.mailConfig.password,
        },
        ...(this.mailConfig.tlsInsecure ? { tls: { rejectUnauthorized: false } } : {}),
      });
    }
    return this.transporter;
  }
}
