import { ForbiddenException } from '@nestjs/common';

import { UserRole } from '~common/enums';

import { isAdmin, isClubStaff } from './roles';

export function requireAdmin(roles: UserRole[] | undefined): void {
  if (!isAdmin(roles)) {
    throw new ForbiddenException('Admin role required');
  }
}

export function requireClubMember(
  roles: UserRole[] | undefined,
  userClubId: string | null,
  clubId: string,
): void {
  if (isAdmin(roles)) {
    return;
  }
  if (userClubId === clubId) {
    return;
  }
  throw new ForbiddenException('Cannot access another club');
}

export function requireClubStaffOf(
  roles: UserRole[] | undefined,
  userClubId: string | null,
  clubId: string,
): void {
  if (isAdmin(roles)) {
    return;
  }
  if (isClubStaff(roles) && userClubId === clubId) {
    return;
  }
  throw new ForbiddenException('Insufficient permissions for this club');
}
