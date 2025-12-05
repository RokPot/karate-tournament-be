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
  WHITE = 'white',
  YELLOW = 'yellow',
  ORANGE = 'orange',
  GREEN = 'green',
  BLUE = 'blue',
  BROWN = 'brown',
  BLACK = 'black',
  BLACK_DAN_1 = 'black_dan_1',
  BLACK_DAN_2 = 'black_dan_2',
  BLACK_DAN_3 = 'black_dan_3',
  BLACK_DAN_4 = 'black_dan_4',
  BLACK_DAN_5 = 'black_dan_5',
  BLACK_DAN_6 = 'black_dan_6',
  BLACK_DAN_7 = 'black_dan_7',
  BLACK_DAN_8 = 'black_dan_8',
  BLACK_DAN_9 = 'black_dan_9',
  BLACK_DAN_10 = 'black_dan_10',
}

export enum UserRole {
  ORGANIZER = 'organizer',
  COACH = 'coach',
  COMPETITOR = 'competitor',
  JUDGE = 'judge',
  STAFF = 'staff',
}

export enum Discipline {
  KATA = 'kata',
  KUMITE = 'kumite',
}

export enum CategoryGender {
  MALE = 'male',
  FEMALE = 'female',
  MIXED = 'mixed',
}

export enum RegistrationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

