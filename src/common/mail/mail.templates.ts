import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

import type {
  RegistrationEmailFees,
  RegistrationEmailItem,
  SendInvitationEmailParams,
  SendRegistrationConfirmationParams,
  SendRosterOtpParams,
} from './mail.types';

const templateCache = new Map<string, string>();

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function resolveTemplatePath(filename: string): string {
  const candidates = [
    join(__dirname, '..', '..', 'email-templates', filename),
    join(process.cwd(), 'dist', 'email-templates', filename),
    join(process.cwd(), 'src', 'email-templates', filename),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  throw new Error(`Email template not found: ${filename}`);
}

function loadTemplate(filename: string): string {
  const cached = templateCache.get(filename);
  if (cached) {
    return cached;
  }
  const html = readFileSync(resolveTemplatePath(filename), 'utf8');
  templateCache.set(filename, html);
  return html;
}

function replaceParam(html: string, key: string, value: string): string {
  return html.replaceAll(`{{ params.${key} }}`, value);
}

function replaceIfBlock(html: string, key: string, value: string | null | undefined): string {
  const startToken = `{{#if params.${key}}}`;
  const endToken = '{{/if}}';
  const keep = Boolean(value?.trim());
  let result = html;
  let start = result.indexOf(startToken);
  while (start >= 0) {
    const end = result.indexOf(endToken, start + startToken.length);
    if (end < 0) {
      throw new Error(`Unclosed {{#if params.${key}}} in email template`);
    }
    const inner = result.slice(start + startToken.length, end);
    result = result.slice(0, start) + (keep ? inner : '') + result.slice(end + endToken.length);
    start = result.indexOf(startToken);
  }
  return result;
}

/** Drop HTML comments so leftover template docs (e.g. triple-brace notes) never reach Brevo. */
function stripHtmlComments(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, '');
}

/** Replace outer {{#each params.participants}}…{{/each}}, including nested category loops. */
function replaceParticipantsEach(html: string, replacement: string): string {
  const startToken = '{{#each params.participants}}';
  const start = html.indexOf(startToken);
  if (start < 0) {
    throw new Error('Missing {{#each params.participants}} in registration email template');
  }

  let depth = 0;
  let i = start;
  while (i < html.length) {
    if (html.startsWith('{{#each', i)) {
      depth += 1;
      const close = html.indexOf('}}', i);
      i = close < 0 ? html.length : close + 2;
      continue;
    }
    if (html.startsWith('{{/each}}', i)) {
      depth -= 1;
      i += '{{/each}}'.length;
      if (depth === 0) {
        return html.slice(0, start) + replacement + html.slice(i);
      }
      continue;
    }
    i += 1;
  }

  throw new Error('Unclosed {{#each params.participants}} in registration-confirmation.html');
}

function buildParticipantCards(participants: Array<{ name: string; categories: string[] }>): string {
  return participants
    .map((participant) => {
      const categoryLines = participant.categories
        .map(
          (category) => `
                      <p
                        style="
                          margin: 0 0 4px 0;
                          font-size: 14px;
                          line-height: 1.4;
                          font-weight: 400;
                          color: #6b7280;
                        "
                      >
                        ${escapeHtml(category)}
                      </p>`,
        )
        .join('');

      return `
                <table
                  role="presentation"
                  width="100%"
                  cellpadding="0"
                  cellspacing="0"
                  border="0"
                  style="
                    width: 100%;
                    margin: 0 0 8px 0;
                    border: 1px solid #ebeae6;
                    border-radius: 6px;
                    border-collapse: separate;
                  "
                >
                  <tr>
                    <td style="padding: 14px 16px">
                      <p
                        style="
                          margin: 0 0 8px 0;
                          font-size: 16px;
                          line-height: 1.4;
                          font-weight: 500;
                          color: #1c1c1e;
                        "
                      >
                        ${escapeHtml(participant.name)}
                      </p>${categoryLines}
                    </td>
                  </tr>
                </table>`;
    })
    .join('\n');
}

function formatEuro(amount: number): string {
  const formatted = Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
  return `${formatted} €`;
}

function mutedParagraph(text: string, bottomMargin: string): string {
  return `
                <p
                  style="
                    margin: 0 0 ${bottomMargin} 0;
                    font-size: 14px;
                    line-height: 1.5;
                    font-weight: 400;
                    color: #6b7280;
                  "
                >
                  ${text}
                </p>`;
}

function buildClubLine(clubName?: string | null): string {
  const name = clubName?.trim();
  if (!name) {
    return mutedParagraph('&nbsp;', '16px').replace('color: #6b7280;', 'color: #6b7280; font-size: 0; line-height: 0;');
  }
  return mutedParagraph(escapeHtml(name), '16px');
}

function feeRow(label: string, amount: number, emphasize = false): string {
  return `
                  <tr>
                    <td
                      style="
                        padding: 6px 0;
                        font-size: ${emphasize ? '16px' : '14px'};
                        line-height: 1.4;
                        font-weight: ${emphasize ? '500' : '400'};
                        color: #1c1c1e;
                      "
                    >
                      ${escapeHtml(label)}
                    </td>
                    <td
                      align="right"
                      style="
                        padding: 6px 0;
                        font-size: ${emphasize ? '16px' : '14px'};
                        line-height: 1.4;
                        font-weight: ${emphasize ? '500' : '400'};
                        color: #1c1c1e;
                        white-space: nowrap;
                      "
                    >
                      ${escapeHtml(formatEuro(amount))}
                    </td>
                  </tr>`;
}

function buildFeesSection(fees?: RegistrationEmailFees | null): string {
  if (!fees) {
    return '';
  }

  const participantRows = fees.participants.map((participant) => {
    const countLabel = participant.categoryCount === 1 ? '1 category' : `${participant.categoryCount} categories`;
    return feeRow(`${participant.name} (${countLabel})`, participant.amount);
  });
  const teamRows = fees.teams.map((team) => feeRow(`${team.name} (team)`, team.amount));
  const rows = [...participantRows, ...teamRows, feeRow('Total', fees.total, true)].join('');

  return `
                <p
                  style="
                    margin: 24px 0 12px 0;
                    font-size: 16px;
                    line-height: 1.5;
                    font-weight: 500;
                    color: #1c1c1e;
                  "
                >
                  Fees due
                </p>
                <table
                  role="presentation"
                  width="100%"
                  cellpadding="0"
                  cellspacing="0"
                  border="0"
                  style="width: 100%; margin: 0 0 8px 0"
                >
                  ${rows}
                </table>`;
}

function groupParticipants(registrations: RegistrationEmailItem[]): Array<{ name: string; categories: string[] }> {
  const byName = new Map<string, string[]>();
  for (const item of registrations) {
    const name = item.participantName.trim() || 'Participant';
    const category = item.categoryName.trim() || 'Category';
    const existing = byName.get(name) ?? [];
    existing.push(category);
    byName.set(name, existing);
  }
  return Array.from(byName.entries()).map(([name, categories]) => ({ name, categories }));
}

export function buildRosterOtpEmail(params: SendRosterOtpParams): { subject: string; html: string; text: string } {
  const tournamentName = params.tournamentName.trim() || 'Tournament';
  const code = params.code.trim();
  const firstName = params.firstName?.trim() || '';
  const clubName = params.clubName?.trim() || '';
  const expiresInMinutes = params.expiresInMinutes && params.expiresInMinutes > 0 ? params.expiresInMinutes : 10;
  const subject = `Your registration code for ${tournamentName}`;

  let html = loadTemplate('registration-otp.html');
  html = replaceIfBlock(html, 'firstName', firstName);
  html = replaceIfBlock(html, 'clubName', clubName);
  html = replaceParam(html, 'firstName', escapeHtml(firstName));
  html = replaceParam(html, 'clubName', escapeHtml(clubName));
  html = replaceParam(html, 'tournamentName', escapeHtml(tournamentName));
  html = replaceParam(html, 'code', escapeHtml(code));
  html = replaceParam(html, 'expiresInMinutes', escapeHtml(String(expiresInMinutes)));
  html = stripHtmlComments(html);

  const text = [
    ...(firstName ? [`Hi ${firstName},`, ''] : []),
    `Use this code to continue your registration for ${tournamentName}.`,
    ...(clubName ? [`Club: ${clubName}`] : []),
    '',
    `Registration code: ${code}`,
    '',
    `This code expires in ${expiresInMinutes} minutes.`,
    '',
    "If you didn't ask to continue this registration, you can ignore this email.",
  ].join('\n');

  return { subject, html, text };
}

export function buildInvitationEmail(params: SendInvitationEmailParams): {
  subject: string;
  html: string;
  text: string;
} {
  const clubName = params.clubName.trim() || 'a club';
  const firstName = params.firstName?.trim() || 'there';
  const acceptUrl = params.inviteUrl;
  const subject = `You're invited to join ${clubName} on Karate App`;

  let html = loadTemplate('club-invitation.html');
  html = replaceParam(html, 'firstName', escapeHtml(firstName));
  html = replaceParam(html, 'clubName', escapeHtml(clubName));
  html = replaceParam(html, 'expiresInDays', escapeHtml(String(params.expiresInDays)));
  html = replaceParam(html, 'acceptUrl', escapeHtml(acceptUrl));
  html = stripHtmlComments(html);

  const text = [
    `Hi ${firstName},`,
    '',
    `You have been invited to join ${clubName} on Karate App.`,
    `This invitation expires in ${params.expiresInDays} days.`,
    '',
    `Accept invitation: ${acceptUrl}`,
  ].join('\n');

  return { subject, html, text };
}

type RegistrationSummaryEmailCopy = {
  filename: string;
  subject: (tournamentName: string) => string;
  introLines: string[];
  listHeading: string;
};

function buildRegistrationSummaryEmail(
  params: Pick<
    SendRegistrationConfirmationParams,
    'recipientName' | 'tournamentName' | 'clubName' | 'registrations' | 'fees'
  >,
  copy: RegistrationSummaryEmailCopy,
): { subject: string; html: string; text: string } {
  const recipientName = params.recipientName?.trim() || 'there';
  const tournamentName =
    params.tournamentName?.trim() || params.registrations[0]?.tournamentName?.trim() || 'Tournament';
  const clubName = params.clubName?.trim() || params.registrations[0]?.clubName?.trim() || '';
  const registrationCount = params.registrations.length;
  const participants = groupParticipants(params.registrations);
  const subject = copy.subject(tournamentName);

  let html = loadTemplate(copy.filename);
  html = replaceParam(html, 'recipientName', escapeHtml(recipientName));
  html = replaceParam(html, 'tournamentName', escapeHtml(tournamentName));
  html = replaceParam(html, 'registrationCount', escapeHtml(String(registrationCount)));
  html = html.replaceAll('{{ params.clubLine }}', buildClubLine(clubName));
  html = replaceParticipantsEach(html, buildParticipantCards(participants));
  html = html.replaceAll('{{ params.feesSection }}', buildFeesSection(params.fees));
  html = stripHtmlComments(html);

  const textRows = participants
    .map((participant) => {
      const categories = participant.categories.map((category) => `  - ${category}`).join('\n');
      return `- ${participant.name}\n${categories}`;
    })
    .join('\n');

  const feeTextRows = params.fees
    ? [
        '',
        'Fees due',
        ...params.fees.participants.map((participant) => {
          const countLabel = participant.categoryCount === 1 ? '1 category' : `${participant.categoryCount} categories`;
          return `- ${participant.name} (${countLabel}): ${formatEuro(participant.amount)}`;
        }),
        ...params.fees.teams.map((team) => `- ${team.name} (team): ${formatEuro(team.amount)}`),
        `Total: ${formatEuro(params.fees.total)}`,
      ]
    : [];

  const text = [
    `Hi ${recipientName},`,
    '',
    ...copy.introLines,
    tournamentName,
    ...(clubName ? [clubName] : []),
    '',
    `${copy.listHeading} (${registrationCount} registrations)`,
    textRows,
    ...feeTextRows,
  ].join('\n');

  return { subject, html, text };
}

export function buildRegistrationConfirmationEmail(
  params: Pick<
    SendRegistrationConfirmationParams,
    'recipientName' | 'tournamentName' | 'clubName' | 'registrations' | 'fees'
  >,
): { subject: string; html: string; text: string } {
  return buildRegistrationSummaryEmail(params, {
    filename: 'registration-confirmation.html',
    subject: (tournamentName) => `Registration confirmed — ${tournamentName}`,
    introLines: ['Your registration was successful.'],
    listHeading: 'Registered',
  });
}

export function buildRegistrationUpdatedEmail(
  params: Pick<
    SendRegistrationConfirmationParams,
    'recipientName' | 'tournamentName' | 'clubName' | 'registrations' | 'fees'
  >,
): { subject: string; html: string; text: string } {
  return buildRegistrationSummaryEmail(params, {
    filename: 'registration-updated.html',
    subject: (tournamentName) => `Registration updated — ${tournamentName}`,
    introLines: [
      'Your registration was updated.',
      'This is your current total for this tournament after your latest edits.',
    ],
    listHeading: 'Current registrations',
  });
}
