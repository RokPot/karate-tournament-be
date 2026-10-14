import { describe, expect, it } from 'vitest';

import { groupBySubmissionAccount, submissionAccountKey } from './submission-account-key';

describe('submissionAccountKey', () => {
  it('groups by registeredByUserId and clubId when both are set', () => {
    expect(
      submissionAccountKey({
        registeredByUserId: 'user-1',
        email: 'coach@club.com',
        clubId: 'club-1',
        clubName: 'SKIF',
      }),
    ).toBe('user-1|club:club-1');
  });

  it('falls back to email and a normalized club name', () => {
    expect(
      submissionAccountKey({
        registeredByUserId: null,
        email: '  Coach@Club.COM ',
        clubId: null,
        clubName: '  SKIF Ljubljana  ',
      }),
    ).toBe('email:coach@club.com|name:skif ljubljana');
  });

  it('uses no-club when club is missing', () => {
    expect(
      submissionAccountKey({
        registeredByUserId: 'user-1',
        email: 'coach@club.com',
        clubId: null,
        clubName: '  ',
      }),
    ).toBe('user-1|no-club');
  });
});

describe('groupBySubmissionAccount', () => {
  const at = (iso: string) => new Date(iso);

  it('keeps submits in a group oldest-first and sorts groups by latest submit', () => {
    const groups = groupBySubmissionAccount([
      {
        registeredByUserId: 'coach-a',
        email: 'a@club.com',
        clubId: 'club-1',
        clubName: 'Club',
        createdAt: at('2026-03-02T10:00:00.000Z'),
      },
      {
        registeredByUserId: 'coach-b',
        email: 'b@club.com',
        clubId: 'club-2',
        clubName: 'Other',
        createdAt: at('2026-03-03T10:00:00.000Z'),
      },
      {
        registeredByUserId: 'coach-a',
        email: 'a@club.com',
        clubId: 'club-1',
        clubName: 'Club',
        createdAt: at('2026-03-01T10:00:00.000Z'),
      },
    ]);

    expect(groups.map((group) => group.groupKey)).toEqual(['coach-b|club:club-2', 'coach-a|club:club-1']);
    expect(groups[1].submissions.map((item) => item.createdAt.toISOString())).toEqual([
      '2026-03-01T10:00:00.000Z',
      '2026-03-02T10:00:00.000Z',
    ]);
  });
});
