import { UserRole } from '~common/enums';

export function hasRole(roles: UserRole[] | undefined, role: UserRole): boolean {
  return (roles ?? []).includes(role);
}

export function hasAnyRole(roles: UserRole[] | undefined, rolesToMatch: UserRole[]): boolean {
  return rolesToMatch.some((role) => hasRole(roles, role));
}

export function isAdmin(roles: UserRole[] | undefined): boolean {
  return hasRole(roles, UserRole.ADMIN);
}

export function isClubOwner(roles: UserRole[] | undefined): boolean {
  return hasRole(roles, UserRole.CLUB_OWNER);
}

export function isClubCoach(roles: UserRole[] | undefined): boolean {
  return hasRole(roles, UserRole.CLUB_COACH);
}

export function isClubStaff(roles: UserRole[] | undefined): boolean {
  return hasAnyRole(roles, [UserRole.CLUB_OWNER, UserRole.CLUB_COACH]);
}

export function isJudge(roles: UserRole[] | undefined): boolean {
  return hasRole(roles, UserRole.JUDGE);
}
