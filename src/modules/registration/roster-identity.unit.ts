import { describe, expect, it } from 'vitest';

import type { RegistrationSubmission } from './registration-submission.entity';
import {
  clubMatchesRoster,
  latestSubmission,
  normalizeRosterEmail,
  oldestSubmission,
  submissionMatchesRosterEmail,
} from './roster-identity';

describe('normalizeRosterEmail', () => {
  it('trims and lowercases', () => {
    expect(normalizeRosterEmail('  Coach@Club.COM ')).toBe('coach@club.com');
  });
});

describe('clubMatchesRoster', () => {
  it('matches resolved clubId', () => {
    expect(clubMatchesRoster({ clubId: 'club-1', clubName: 'SKIF' }, 'club-1', 'SKIF')).toBe(true);
  });

  it('matches typed name when the submission has no clubId', () => {
    expect(clubMatchesRoster({ clubId: null, clubName: 'SKIF Ljubljana' }, null, '  skif ljubljana  ')).toBe(true);
  });

  it('matches no-club', () => {
    expect(clubMatchesRoster({ clubId: null, clubName: null }, null, null)).toBe(true);
    expect(clubMatchesRoster({ clubId: null, clubName: '  ' }, null, undefined)).toBe(true);
  });
});

describe('submissionMatchesRosterEmail', () => {
  it('matches the snapshot email', () => {
    expect(
      submissionMatchesRosterEmail({ email: 'coach@club.com', registeredByUserId: 'user-1' }, 'coach@club.com', null),
    ).toBe(true);
  });

  it('matches the coach user id when the snapshot email differs', () => {
    expect(
      submissionMatchesRosterEmail({ email: 'old@club.com', registeredByUserId: 'user-1' }, 'new@club.com', 'user-1'),
    ).toBe(true);
  });
});

describe('oldestSubmission / latestSubmission', () => {
  const first = {
    id: 'a',
    createdAt: new Date('2026-01-01T10:00:00.000Z'),
    updatedAt: new Date('2026-01-01T10:00:00.000Z'),
  } as RegistrationSubmission;
  const later = {
    id: 'b',
    createdAt: new Date('2026-02-01T10:00:00.000Z'),
    updatedAt: new Date('2026-03-01T10:00:00.000Z'),
  } as RegistrationSubmission;

  it('keeps the first send as oldest even if a later submit was updated more recently', () => {
    expect(oldestSubmission([later, first]).id).toBe('a');
  });

  it('uses the most recently updated submit for optimistic locking', () => {
    expect(latestSubmission([first, later]).id).toBe('b');
  });
});
