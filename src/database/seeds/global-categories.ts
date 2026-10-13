import { BeltLevel, CategoryGender, Discipline } from '~common/enums';

export type GlobalCategorySeed = {
  name: string;
  discipline: Discipline;
  gender: CategoryGender | null;
  ageMin: number | null;
  ageMax: number | null;
  weightMin: number | null;
  weightMax: number | null;
  beltMin: BeltLevel | null;
  beltMax: BeltLevel | null;
  teamSize: number | null;
  teamReservesSize: number | null;
};

const individual = {
  weightMin: null as number | null,
  weightMax: null as number | null,
  beltMin: null as BeltLevel | null,
  beltMax: null as BeltLevel | null,
  teamSize: null as number | null,
  teamReservesSize: null as number | null,
};

const labeled = (row: number, name: string, group?: string): string =>
  group ? `${row}. ${name} - ${group}` : `${row}. ${name}`;

const kataAb = (
  row: number,
  name: string,
  gender: CategoryGender,
  ageMin: number | null,
  ageMax: number | null,
  beltB: [BeltLevel, BeltLevel],
  beltA: [BeltLevel, BeltLevel],
): GlobalCategorySeed[] => [
  {
    ...individual,
    name: labeled(row, name, 'A'),
    discipline: Discipline.KATA,
    gender,
    ageMin,
    ageMax,
    beltMin: beltA[0],
    beltMax: beltA[1],
  },
  {
    ...individual,
    name: labeled(row, name, 'B'),
    discipline: Discipline.KATA,
    gender,
    ageMin,
    ageMax,
    beltMin: beltB[0],
    beltMax: beltB[1],
  },
];

const yijuAb = (
  row: number,
  name: string,
  gender: CategoryGender,
  ageMin: number | null,
  ageMax: number | null,
  splitKg: number,
): GlobalCategorySeed[] => [
  {
    ...individual,
    name: labeled(row, name, 'A'),
    discipline: Discipline.YIJU_KUMITE,
    gender,
    ageMin,
    ageMax,
    weightMax: splitKg,
  },
  {
    ...individual,
    name: labeled(row, name, 'B'),
    discipline: Discipline.YIJU_KUMITE,
    gender,
    ageMin,
    ageMax,
    weightMin: splitKg,
  },
];

const kataTeam = (row: number, name: string, group: string, gender: CategoryGender): GlobalCategorySeed => ({
  ...individual,
  name: labeled(row, name, group),
  discipline: Discipline.KATA_TEAM,
  gender,
  ageMin: 15,
  ageMax: null,
  teamSize: 3,
  teamReservesSize: 1,
});

const kumiteTeam = (row: number, name: string, group: string, gender: CategoryGender): GlobalCategorySeed => ({
  ...individual,
  name: labeled(row, name, group),
  discipline: Discipline.KUMITE_TEAM,
  gender,
  ageMin: 17,
  ageMax: null,
  teamSize: 3,
  teamReservesSize: 1,
});

/**
 * Official SKIF Slovenia catalog from KATEGORIJE.pdf (global, clubId null).
 * Names use the PDF row number. Row 19 Para Karate is omitted.
 */
export const GLOBAL_CATEGORIES: GlobalCategorySeed[] = [
  // Kata 1–18: A/B belt groups
  ...kataAb(
    1,
    'Mlajši Malčki',
    CategoryGender.MALE,
    0,
    8,
    [BeltLevel.KYU_10, BeltLevel.KYU_8],
    [BeltLevel.KYU_7, BeltLevel.KYU_1],
  ),
  ...kataAb(
    2,
    'Mlajše Malčice',
    CategoryGender.FEMALE,
    0,
    8,
    [BeltLevel.KYU_10, BeltLevel.KYU_8],
    [BeltLevel.KYU_7, BeltLevel.KYU_1],
  ),
  ...kataAb(
    3,
    'Starejši Malčki',
    CategoryGender.MALE,
    8,
    10,
    [BeltLevel.KYU_10, BeltLevel.KYU_7],
    [BeltLevel.KYU_6, BeltLevel.KYU_1],
  ),
  ...kataAb(
    4,
    'Starejše Malčice',
    CategoryGender.FEMALE,
    8,
    10,
    [BeltLevel.KYU_10, BeltLevel.KYU_7],
    [BeltLevel.KYU_6, BeltLevel.KYU_1],
  ),
  ...kataAb(
    5,
    'Mlajši Dečki',
    CategoryGender.MALE,
    10,
    12,
    [BeltLevel.KYU_10, BeltLevel.KYU_6],
    [BeltLevel.KYU_5, BeltLevel.KYU_1],
  ),
  ...kataAb(
    6,
    'Mlajše Deklice',
    CategoryGender.FEMALE,
    10,
    12,
    [BeltLevel.KYU_10, BeltLevel.KYU_6],
    [BeltLevel.KYU_5, BeltLevel.KYU_1],
  ),
  ...kataAb(
    7,
    'Starejši Dečki',
    CategoryGender.MALE,
    12,
    14,
    [BeltLevel.KYU_10, BeltLevel.KYU_6],
    [BeltLevel.KYU_5, BeltLevel.DAN_10],
  ),
  ...kataAb(
    8,
    'Starejše Deklice',
    CategoryGender.FEMALE,
    12,
    14,
    [BeltLevel.KYU_10, BeltLevel.KYU_6],
    [BeltLevel.KYU_5, BeltLevel.DAN_10],
  ),
  ...kataAb(
    9,
    'Mlajši Mladinci',
    CategoryGender.MALE,
    13,
    15,
    [BeltLevel.KYU_10, BeltLevel.KYU_4],
    [BeltLevel.KYU_3, BeltLevel.DAN_10],
  ),
  ...kataAb(
    10,
    'Mlajše Mladinke',
    CategoryGender.FEMALE,
    13,
    15,
    [BeltLevel.KYU_10, BeltLevel.KYU_4],
    [BeltLevel.KYU_3, BeltLevel.DAN_10],
  ),
  ...kataAb(
    11,
    'Starejši Mladinci',
    CategoryGender.MALE,
    15,
    17,
    [BeltLevel.KYU_10, BeltLevel.KYU_4],
    [BeltLevel.KYU_3, BeltLevel.DAN_10],
  ),
  ...kataAb(
    12,
    'Starejše Mladinke',
    CategoryGender.FEMALE,
    15,
    17,
    [BeltLevel.KYU_10, BeltLevel.KYU_4],
    [BeltLevel.KYU_3, BeltLevel.DAN_10],
  ),
  ...kataAb(
    13,
    'Člani',
    CategoryGender.MALE,
    16,
    null,
    [BeltLevel.KYU_10, BeltLevel.KYU_4],
    [BeltLevel.KYU_3, BeltLevel.DAN_10],
  ),
  ...kataAb(
    14,
    'Članice',
    CategoryGender.FEMALE,
    16,
    null,
    [BeltLevel.KYU_10, BeltLevel.KYU_4],
    [BeltLevel.KYU_3, BeltLevel.DAN_10],
  ),
  ...kataAb(
    15,
    'Starejši Člani',
    CategoryGender.MALE,
    35,
    49,
    [BeltLevel.KYU_10, BeltLevel.KYU_4],
    [BeltLevel.KYU_3, BeltLevel.DAN_10],
  ),
  ...kataAb(
    16,
    'Starejše Članice',
    CategoryGender.FEMALE,
    35,
    49,
    [BeltLevel.KYU_10, BeltLevel.KYU_4],
    [BeltLevel.KYU_3, BeltLevel.DAN_10],
  ),
  ...kataAb(
    17,
    'Starejši Člani',
    CategoryGender.MALE,
    50,
    null,
    [BeltLevel.KYU_10, BeltLevel.KYU_4],
    [BeltLevel.KYU_3, BeltLevel.DAN_10],
  ),
  ...kataAb(
    18,
    'Starejše Članice',
    CategoryGender.FEMALE,
    50,
    null,
    [BeltLevel.KYU_10, BeltLevel.KYU_4],
    [BeltLevel.KYU_3, BeltLevel.DAN_10],
  ),

  kataTeam(20, 'Kate Ekipno', 'A', CategoryGender.MALE),
  kataTeam(20, 'Kate Ekipno', 'B', CategoryGender.FEMALE),

  {
    ...individual,
    name: labeled(21, 'Yako-Soku Kumite'),
    discipline: Discipline.YAKO_SOKU_KUMITE,
    gender: null,
    ageMin: 15,
    ageMax: null,
    teamSize: 2,
    teamReservesSize: 1,
  },

  // Yiju kumite 22–34: A/B (and C) are weight groups
  ...yijuAb(22, 'Malčki', CategoryGender.MALE, 0, 10, 30),
  ...yijuAb(23, 'Malčice', CategoryGender.FEMALE, 0, 10, 30),
  ...yijuAb(24, 'Mlajši Dečki', CategoryGender.MALE, 10, 12, 40),
  ...yijuAb(25, 'Mlajše Deklice', CategoryGender.FEMALE, 10, 12, 40),
  ...yijuAb(26, 'Starejši Dečki', CategoryGender.MALE, 12, 14, 50),
  ...yijuAb(27, 'Starejše Deklice', CategoryGender.FEMALE, 12, 14, 50),
  ...yijuAb(28, 'Mlajši Mladinci', CategoryGender.MALE, 13, 15, 60),
  ...yijuAb(29, 'Mlajše Mladinke', CategoryGender.FEMALE, 13, 15, 60),
  ...yijuAb(30, 'Starejši Mladinci', CategoryGender.MALE, 15, 17, 60),
  ...yijuAb(31, 'Starejše Mladinke', CategoryGender.FEMALE, 15, 17, 60),
  {
    ...individual,
    name: labeled(32, 'Člani', 'A'),
    discipline: Discipline.YIJU_KUMITE,
    gender: CategoryGender.MALE,
    ageMin: 17,
    ageMax: null,
    weightMax: 65,
  },
  {
    ...individual,
    name: labeled(32, 'Člani', 'B'),
    discipline: Discipline.YIJU_KUMITE,
    gender: CategoryGender.MALE,
    ageMin: 17,
    ageMax: null,
    weightMin: 65,
    weightMax: 75,
  },
  {
    ...individual,
    name: labeled(32, 'Člani', 'C'),
    discipline: Discipline.YIJU_KUMITE,
    gender: CategoryGender.MALE,
    ageMin: 17,
    ageMax: null,
    weightMin: 75,
  },
  ...yijuAb(33, 'Članice', CategoryGender.FEMALE, 17, null, 60),
  {
    ...individual,
    name: labeled(34, 'Starejši Člani'),
    discipline: Discipline.YIJU_KUMITE,
    gender: CategoryGender.MALE,
    ageMin: 35,
    ageMax: null,
  },

  kumiteTeam(35, 'Kumite Ekipno', 'A', CategoryGender.MALE),
  kumiteTeam(35, 'Kumite Ekipno', 'B', CategoryGender.FEMALE),
];
