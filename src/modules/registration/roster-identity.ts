import type { RegistrationSubmission } from './registration-submission.entity';

export type RosterIdentity = {
  tournamentId: string;
  email: string;
  clubId: string | null;
  clubName: string | null;
};

export function normalizeRosterEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function clubMatchesRoster(
  submission: Pick<RegistrationSubmission, 'clubId' | 'clubName'>,
  clubId: string | null,
  clubName: string | null,
): boolean {
  const typed = clubName?.trim() || null;
  if (clubId) {
    if (submission.clubId === clubId) {
      return true;
    }
    return !submission.clubId && (submission.clubName?.trim().toLowerCase() ?? '') === typed?.toLowerCase();
  }
  if (typed) {
    return !submission.clubId && (submission.clubName?.trim().toLowerCase() ?? '') === typed.toLowerCase();
  }
  return !submission.clubId && !submission.clubName?.trim();
}

export function submissionMatchesRosterEmail(
  submission: Pick<RegistrationSubmission, 'email' | 'registeredByUserId'>,
  email: string,
  coachUserId: string | null,
): boolean {
  if (submission.email.trim().toLowerCase() === email) {
    return true;
  }
  return !!coachUserId && submission.registeredByUserId === coachUserId;
}

export function latestSubmission(submissions: RegistrationSubmission[]): RegistrationSubmission {
  return [...submissions].sort((a, b) => {
    const aMs = (a.updatedAt ?? a.createdAt).getTime();
    const bMs = (b.updatedAt ?? b.createdAt).getTime();
    return bMs - aMs;
  })[0];
}

export function oldestSubmission(submissions: RegistrationSubmission[]): RegistrationSubmission {
  return [...submissions].sort((a, b) => {
    const aMs = a.createdAt.getTime();
    const bMs = b.createdAt.getTime();
    return aMs - bMs || a.id.localeCompare(b.id);
  })[0];
}
