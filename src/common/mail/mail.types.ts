export interface SendInvitationEmailParams {
  to: string;
  clubName: string;
  inviteUrl: string;
  firstName?: string | null;
  expiresInDays: number;
}

export interface RegistrationEmailItem {
  participantName: string;
  tournamentName: string;
  categoryName: string;
  clubName?: string | null;
}

export interface RegistrationEmailFeeParticipant {
  name: string;
  categoryCount: number;
  amount: number;
}

export interface RegistrationEmailFeeTeam {
  name: string;
  amount: number;
}

export interface RegistrationEmailFees {
  participants: RegistrationEmailFeeParticipant[];
  teams: RegistrationEmailFeeTeam[];
  total: number;
}

export interface SendRosterOtpParams {
  to: string;
  tournamentName: string;
  code: string;
  firstName?: string | null;
  clubName?: string | null;
  expiresInMinutes?: number;
}

export interface SendRegistrationConfirmationParams {
  to: string;
  recipientName?: string | null;
  tournamentName?: string | null;
  clubName?: string | null;
  registrations: RegistrationEmailItem[];
  fees?: RegistrationEmailFees | null;
}

export type SendRegistrationUpdatedParams = SendRegistrationConfirmationParams;
