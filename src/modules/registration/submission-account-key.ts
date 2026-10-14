export type SubmissionAccountFields = {
  registeredByUserId: string | null;
  email: string;
  clubId: string | null;
  clubName: string | null;
  createdAt: Date;
};

/**
 * Stable grouping key for public submits by the same coach + club in one tournament.
 */
export function submissionAccountKey(submission: {
  registeredByUserId: string | null;
  email: string;
  clubId: string | null;
  clubName: string | null;
}): string {
  const registrar = submission.registeredByUserId ?? `email:${submission.email.trim().toLowerCase()}`;
  if (submission.clubId) {
    return `${registrar}|club:${submission.clubId}`;
  }

  const clubName = submission.clubName?.trim().toLowerCase();
  if (clubName) {
    return `${registrar}|name:${clubName}`;
  }

  return `${registrar}|no-club`;
}

export function groupBySubmissionAccount<T extends SubmissionAccountFields>(
  submissions: T[],
): Array<{ groupKey: string; submissions: T[] }> {
  const groups = new Map<string, T[]>();

  for (const submission of submissions) {
    const key = submissionAccountKey(submission);
    const items = groups.get(key);
    if (items) {
      items.push(submission);
    } else {
      groups.set(key, [submission]);
    }
  }

  const createdAtMs = (value: Date): number => (value instanceof Date ? value.getTime() : new Date(value).getTime());

  return [...groups.entries()]
    .map(([groupKey, items]) => ({
      groupKey,
      submissions: [...items].sort((a, b) => createdAtMs(a.createdAt) - createdAtMs(b.createdAt)),
    }))
    .sort((a, b) => {
      const latestA = createdAtMs(a.submissions[a.submissions.length - 1].createdAt);
      const latestB = createdAtMs(b.submissions[b.submissions.length - 1].createdAt);
      return latestB - latestA || a.groupKey.localeCompare(b.groupKey);
    });
}
