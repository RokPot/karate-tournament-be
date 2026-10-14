import { describe, expect, it } from 'vitest';

import { nextAvailableTeamName, resolveTeamName, teamNameBase, TEAM_NAME_MAX_LENGTH } from './team-name';

describe('teamNameBase', () => {
  it('prefers a club name over starter surnames', () => {
    expect(teamNameBase('  SKIF Ljubljana  ', ['Novak', 'Horvat'])).toBe('SKIF Ljubljana');
  });

  it('joins starter last names when there is no club', () => {
    expect(teamNameBase(null, ['Novak', ' Horvat ', '', null])).toBe('Novak / Horvat');
  });

  it('falls back to Team when nothing is provided', () => {
    expect(teamNameBase(undefined, [])).toBe('Team');
    expect(teamNameBase('  ', [null, ''])).toBe('Team');
  });
});

describe('nextAvailableTeamName', () => {
  it('returns the base when it is free', () => {
    expect(nextAvailableTeamName('Dragon', ['Other'])).toBe('Dragon');
  });

  it('appends A when the base is taken, then B, then 27 after Z', () => {
    expect(nextAvailableTeamName('Dragon', ['dragon'])).toBe('Dragon A');
    expect(nextAvailableTeamName('Dragon', ['Dragon', 'Dragon A'])).toBe('Dragon B');

    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((letter) => `Dragon ${letter}`);
    expect(nextAvailableTeamName('Dragon', ['Dragon', ...letters])).toBe('Dragon 27');
    expect(nextAvailableTeamName('Dragon', ['Dragon', ...letters, 'Dragon 27'])).toBe('Dragon 28');
  });

  it('is case-insensitive against taken names', () => {
    expect(nextAvailableTeamName('Dragon', ['DRAGON A'])).toBe('Dragon');
    expect(nextAvailableTeamName('Dragon', ['dragon', 'dragon a'])).toBe('Dragon B');
  });
});

describe('resolveTeamName', () => {
  it('uses a trimmed provided name even when that name is already taken', () => {
    expect(
      resolveTeamName({
        provided: '  SKIF A  ',
        clubName: 'SKIF Ljubljana',
        starterLastNames: ['Novak'],
        taken: ['SKIF A'],
      }),
    ).toBe('SKIF A');
  });

  it('generates from club name when the provided name is empty', () => {
    expect(
      resolveTeamName({
        provided: '   ',
        clubName: 'SKIF Ljubljana',
        starterLastNames: ['Novak'],
        taken: [],
      }),
    ).toBe('SKIF Ljubljana');
  });

  it('clips a provided name to the max length', () => {
    const provided = 'T'.repeat(TEAM_NAME_MAX_LENGTH + 10);
    expect(resolveTeamName({ provided, taken: [] })).toHaveLength(TEAM_NAME_MAX_LENGTH);
  });
});
