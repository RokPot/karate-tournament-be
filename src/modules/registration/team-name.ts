export const TEAM_NAME_MAX_LENGTH = 255;
const LETTER_SUFFIXES = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function clipTeamName(name: string): string {
  if (name.length <= TEAM_NAME_MAX_LENGTH) {
    return name;
  }
  return name.slice(0, TEAM_NAME_MAX_LENGTH).trimEnd();
}

function clipTeamNameWithSuffix(base: string, suffix: string): string {
  const maxBaseLength = TEAM_NAME_MAX_LENGTH - 1 - suffix.length;
  const clippedBase = maxBaseLength < base.length ? base.slice(0, Math.max(1, maxBaseLength)).trimEnd() : base;
  return `${clippedBase} ${suffix}`;
}

export function teamNameScopeKey(categoryId: string, clubId: string | null | undefined): string {
  return `${categoryId}|${clubId ?? 'no-club'}`;
}

export function teamNameBase(clubName?: string | null, starterLastNames?: Array<string | null | undefined>): string {
  const club = clubName?.trim();
  if (club) {
    return club;
  }

  const surnames = (starterLastNames ?? []).map((part) => part?.trim()).filter((part): part is string => !!part);
  if (surnames.length > 0) {
    return surnames.join(' / ');
  }

  return 'Team';
}

export function nextAvailableTeamName(base: string, taken: Iterable<string>): string {
  const normalizedBase = clipTeamName(base.trim() || 'Team');
  const takenLower = new Set([...taken].map((name) => name.trim().toLowerCase()).filter((name) => name.length > 0));

  if (!takenLower.has(normalizedBase.toLowerCase())) {
    return normalizedBase;
  }

  for (const letter of LETTER_SUFFIXES) {
    const candidate = clipTeamNameWithSuffix(normalizedBase, letter);
    if (!takenLower.has(candidate.toLowerCase())) {
      return candidate;
    }
  }

  let index = 27;
  while (takenLower.has(clipTeamNameWithSuffix(normalizedBase, String(index)).toLowerCase())) {
    index += 1;
  }
  return clipTeamNameWithSuffix(normalizedBase, String(index));
}

export function resolveTeamName(input: {
  provided?: string | null;
  clubName?: string | null;
  starterLastNames?: Array<string | null | undefined>;
  taken: Iterable<string>;
}): string {
  const provided = input.provided?.trim();
  if (provided) {
    return clipTeamName(provided);
  }

  return nextAvailableTeamName(teamNameBase(input.clubName, input.starterLastNames), input.taken);
}
