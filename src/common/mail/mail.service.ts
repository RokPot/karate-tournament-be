import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import nodemailer, { type Transporter } from 'nodemailer';

import { MailConfig } from './mail.config';
import {
  buildInvitationEmail,
  buildRegistrationConfirmationEmail,
  buildRegistrationUpdatedEmail,
  buildRosterOtpEmail,
} from './mail.templates';
import type {
  SendInvitationEmailParams,
  SendRegistrationConfirmationParams,
  SendRegistrationUpdatedParams,
  SendRosterOtpParams,
} from './mail.types';

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly mailConfig: MailConfig) {}

  onModuleInit(): void {
    const { enabled, host, port, user, password, from, apiKey, tlsInsecure } = this.mailConfig;
    const transport = this.resolveTransport();
    this.logger.log(
      `Mail config: enabled=${enabled} transport=${transport} host=${host} port=${port} user=${user ? 'set' : 'missing'} password=${password ? 'set' : 'missing'} apiKey=${apiKey ? 'set' : 'missing'} from=${from ? 'set' : 'missing'} tlsInsecure=${Boolean(tlsInsecure)}`,
    );
    if (tlsInsecure) {
      this.logger.warn(
        'mail.tlsInsecure=true: SMTP TLS certificate verification is disabled. Use only on trusted dev machines.',
      );
    }
    if (enabled && transport === 'none') {
      this.logger.warn(
        'Mail is enabled but neither apiKey nor SMTP user/password/from is complete — sends will be skipped.',
      );
    }
    if (!enabled) {
      this.logger.warn('Mail is disabled (mail.enabled=false) — invitation and registration emails will not be sent.');
    }
  }

  /**
   * Queue invitation email in the background. Resolves immediately; SMTP/API runs after the HTTP response.
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
   * Queue registration confirmation in the background. Resolves immediately; SMTP/API runs after the HTTP response.
   */
  isDebugOtpAllowed(): boolean {
    return process.env.STAGE !== 'production' && !this.mailConfig.enabled;
  }

  async sendRosterOtp(params: SendRosterOtpParams): Promise<void> {
    this.logger.log(`Queue roster OTP email to=${params.to} tournament=${params.tournamentName}`);
    this.enqueue(`roster OTP to ${params.to}`, async () => {
      const content = buildRosterOtpEmail(params);
      await this.send({
        to: params.to,
        subject: content.subject,
        html: content.html,
        text: content.text,
      });
    });
  }

  async sendRegistrationConfirmation(params: SendRegistrationConfirmationParams): Promise<void> {
    this.queueRegistrationSummary(params, 'confirmation', buildRegistrationConfirmationEmail);
  }

  async sendRegistrationUpdated(params: SendRegistrationUpdatedParams): Promise<void> {
    this.queueRegistrationSummary(params, 'updated', buildRegistrationUpdatedEmail);
  }

  private queueRegistrationSummary(
    params: SendRegistrationConfirmationParams,
    kind: 'confirmation' | 'updated',
    build: typeof buildRegistrationConfirmationEmail,
  ): void {
    if (params.registrations.length < 1) {
      this.logger.warn(`Skip registration ${kind} email to=${params.to}: no registrations to include`);
      return;
    }
    this.logger.log(
      `Queue registration ${kind} email to=${params.to} count=${params.registrations.length} tournament=${params.tournamentName ?? 'n/a'}`,
    );
    this.enqueue(`registration ${kind} to ${params.to}`, async () => {
      this.logger.log(`Building registration ${kind} email to=${params.to}`);
      const content = build(params);
      await this.send({
        to: params.to,
        subject: content.subject,
        html: content.html,
        text: content.text,
      });
    });
  }

  private resolveTransport(): 'api' | 'smtp' | 'none' {
    if (!this.mailConfig.enabled) {
      return 'none';
    }
    if (this.mailConfig.apiKey?.trim() && this.mailConfig.from?.trim()) {
      return 'api';
    }
    if (this.mailConfig.user?.trim() && this.mailConfig.password?.trim() && this.mailConfig.from?.trim()) {
      return 'smtp';
    }
    return 'none';
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
    const transport = this.resolveTransport();
    if (transport === 'none') {
      this.logger.warn(
        `Mail not configured for send; skipped "${params.subject}" to ${params.to} (enabled=${this.mailConfig.enabled} apiKey=${this.mailConfig.apiKey ? 'set' : 'missing'} smtp=${this.mailConfig.user && this.mailConfig.password ? 'set' : 'missing'} from=${this.mailConfig.from ? 'set' : 'missing'})`,
      );
      return;
    }

    try {
      if (transport === 'api') {
        await this.sendViaBrevoApi(params);
      } else {
        await this.sendViaSmtp(params);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to send "${params.subject}" to ${params.to}: ${message}`);
    }
  }

  private async sendViaBrevoApi(params: { to: string; subject: string; html: string; text: string }): Promise<void> {
    const apiKey = this.mailConfig.apiKey!.trim();
    const sender = parseFromAddress(this.mailConfig.from!);

    this.logger.log(`Sending "${params.subject}" to ${params.to} via Brevo API`);
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender,
        to: [{ email: params.to }],
        subject: params.subject,
        htmlContent: params.html,
        textContent: params.text,
      }),
    });

    const bodyText = await response.text();
    if (!response.ok) {
      throw new Error(`Brevo API ${response.status}: ${bodyText.slice(0, 500)}`);
    }

    let messageId = 'n/a';
    try {
      const parsed = JSON.parse(bodyText) as { messageId?: string };
      messageId = parsed.messageId ?? 'n/a';
    } catch {
      // ignore parse errors; send still succeeded
    }

    this.logger.log(`Sent "${params.subject}" to ${params.to} via Brevo API messageId=${messageId}`);
  }

  private async sendViaSmtp(params: { to: string; subject: string; html: string; text: string }): Promise<void> {
    const { host, port, from } = this.mailConfig;
    this.logger.log(`Sending "${params.subject}" to ${params.to} via SMTP ${host}:${port}`);
    const transporter = this.getTransporter();
    const info = await transporter.sendMail({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });
    this.logger.log(
      `Sent "${params.subject}" to ${params.to} via SMTP ${host}:${port} messageId=${info.messageId ?? 'n/a'} response=${info.response ?? 'n/a'}`,
    );
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

function parseFromAddress(from: string): { name?: string; email: string } {
  const match = from.trim().match(/^(.*?)\s*<([^>]+)>\s*$/);
  if (match) {
    const name = match[1].replace(/^["']|["']$/g, '').trim();
    return { ...(name ? { name } : {}), email: match[2].trim() };
  }
  return { email: from.trim() };
}
