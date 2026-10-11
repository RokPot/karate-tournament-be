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

export interface SendRegistrationConfirmationParams {
  to: string;
  recipientName?: string | null;
  tournamentName?: string | null;
  registrations: RegistrationEmailItem[];
}
