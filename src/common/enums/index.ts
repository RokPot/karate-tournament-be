/**
 * Domain Enums
 * Shared enums used across the tournament system
 */

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export enum BeltLevel {
  KYU_10 = '10-kyu',
  KYU_9 = '9-kyu',
  KYU_8 = '8-kyu',
  KYU_7 = '7-kyu',
  KYU_6 = '6-kyu',
  KYU_5 = '5-kyu',
  KYU_4 = '4-kyu',
  KYU_3 = '3-kyu',
  KYU_2 = '2-kyu',
  KYU_1 = '1-kyu',
  DAN_1 = '1-dan',
  DAN_2 = '2-dan',
  DAN_3 = '3-dan',
  DAN_4 = '4-dan',
  DAN_5 = '5-dan',
  DAN_6 = '6-dan',
  DAN_7 = '7-dan',
  DAN_8 = '8-dan',
  DAN_9 = '9-dan',
  DAN_10 = '10-dan',
}

export enum UserRole {
  ADMIN = 'admin',
  CLUB_OWNER = 'club_owner',
  CLUB_MEMBER = 'club_member',
  CLUB_COACH = 'club_coach',
  FREE_MEMBER = 'free_member',
  JUDGE = 'judge',
}

export enum Discipline {
  KATA = 'kata',
  KATA_TEAM = 'kata-team',
  KUMITE_TEAM = 'kumite-team',
  YAKO_SOKU_KUMITE = 'yako-soku-kumite',
  YIJU_KUMITE = 'yiju-kumite',
}

export enum SubDiscipline {
  GOHON_IPPON_KUMITE = 'gohon-ippon-kumite',
  SANBON_IPPON_KUMITE = 'sanbon-ippon-kumite',
  KIHON_IPPON_KUMITE = 'kihon-ippon-kumite',
  DYU_IPPON_KUMITE = 'dyu-ippon-kumite',
}

export enum CategoryGender {
  MALE = 'male',
  FEMALE = 'female',
}

export enum RegistrationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum TournamentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  DECLINED = 'declined',
  IN_PROGRESS = 'in_progress',
  ENDED = 'ended',
}

export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export enum TeamRole {
  STARTER = 'starter',
  RESERVE = 'reserve',
}
