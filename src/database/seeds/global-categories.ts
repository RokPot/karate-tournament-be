import { type QueryRunner } from 'typeorm';

import { BeltLevel, CategoryGender, Discipline, SubDiscipline } from '~common/enums';

export type GlobalCategorySeed = {
  name: string;
  discipline: Discipline;
  subDiscipline: SubDiscipline | null;
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

type BeltRange = [BeltLevel, BeltLevel];

const blank = {
  subDiscipline: null as SubDiscipline | null,
  weightMin: null as number | null,
  weightMax: null as number | null,
  beltMin: null as BeltLevel | null,
  beltMax: null as BeltLevel | null,
  teamSize: null as number | null,
  teamReservesSize: null as number | null,
};

const labeled = (row: number, name: string, group?: string): string =>
  group ? `${row}. ${name} - ${group}` : `${row}. ${name}`;

const kataBelts = (
  row: number,
  name: string,
  gender: CategoryGender,
  ageMin: number | null,
  ageMax: number | null,
  groups: Array<{ group: string; belt: BeltRange }>,
): GlobalCategorySeed[] =>
  groups.map(({ group, belt }) => ({
    ...blank,
    name: labeled(row, name, group),
    discipline: Discipline.KATA,
    gender,
    ageMin,
    ageMax,
    beltMin: belt[0],
    beltMax: belt[1],
  }));

const MALCKI_KATA: Array<{ group: string; belt: BeltRange }> = [
  { group: 'A', belt: [BeltLevel.KYU_5, BeltLevel.KYU_1] },
  { group: 'B', belt: [BeltLevel.KYU_7, BeltLevel.KYU_6] },
  { group: 'C', belt: [BeltLevel.KYU_10, BeltLevel.KYU_8] },
];

const KYU_KATA: Array<{ group: string; belt: BeltRange }> = [
  { group: 'A', belt: [BeltLevel.KYU_4, BeltLevel.KYU_1] },
  { group: 'B', belt: [BeltLevel.KYU_6, BeltLevel.KYU_5] },
  { group: 'C', belt: [BeltLevel.KYU_8, BeltLevel.KYU_7] },
  { group: 'D', belt: [BeltLevel.KYU_10, BeltLevel.KYU_9] },
];

const yijuWeights = (
  row: number,
  name: string,
  gender: CategoryGender,
  ageMin: number | null,
  ageMax: number | null,
  groups: Array<{ group: string; weightMin?: number; weightMax?: number }>,
): GlobalCategorySeed[] =>
  groups.map(({ group, weightMin, weightMax }) => ({
    ...blank,
    name: labeled(row, name, group),
    discipline: Discipline.YIJU_KUMITE,
    gender,
    ageMin,
    ageMax,
    weightMin: weightMin ?? null,
    weightMax: weightMax ?? null,
  }));

/** A is the heavier side of a two-way split. */
const yijuAb = (
  row: number,
  name: string,
  gender: CategoryGender,
  ageMin: number | null,
  ageMax: number | null,
  splitKg: number,
): GlobalCategorySeed[] =>
  yijuWeights(row, name, gender, ageMin, ageMax, [
    { group: 'A', weightMin: splitKg },
    { group: 'B', weightMax: splitKg },
  ]);

/** C lightest, B middle, A heaviest. */
const yijuCba = (
  row: number,
  name: string,
  gender: CategoryGender,
  ageMin: number | null,
  ageMax: number | null,
  lowKg: number,
  highKg: number,
): GlobalCategorySeed[] =>
  yijuWeights(row, name, gender, ageMin, ageMax, [
    { group: 'A', weightMin: highKg },
    { group: 'B', weightMin: lowKg, weightMax: highKg },
    { group: 'C', weightMax: lowKg },
  ]);

const kataTeam = (row: number, name: string, ageMin: number | null, ageMax: number | null): GlobalCategorySeed => ({
  ...blank,
  name: labeled(row, name),
  discipline: Discipline.KATA_TEAM,
  gender: null,
  ageMin,
  ageMax,
  teamSize: 3,
  teamReservesSize: 1,
});

const yako = (
  row: number,
  name: string,
  ageMin: number | null,
  ageMax: number | null,
  subDiscipline: SubDiscipline,
  belt: BeltRange,
): GlobalCategorySeed => ({
  ...blank,
  name: labeled(row, name),
  discipline: Discipline.YAKO_SOKU_KUMITE,
  subDiscipline,
  gender: null,
  ageMin,
  ageMax,
  beltMin: belt[0],
  beltMax: belt[1],
  teamSize: 2,
  teamReservesSize: 1,
});

const GOHON_ALL: BeltRange = [BeltLevel.KYU_10, BeltLevel.KYU_1];
const GOHON: BeltRange = [BeltLevel.KYU_10, BeltLevel.KYU_7];
const SANBON: BeltRange = [BeltLevel.KYU_7, BeltLevel.KYU_6];
const KIHON: BeltRange = [BeltLevel.KYU_6, BeltLevel.KYU_4];
const DYU: BeltRange = [BeltLevel.KYU_4, BeltLevel.KYU_1];

/**
 * KYU tournament catalog from KATEGORIJE-2.pdf (global, clubId null).
 * Names use the PDF row number. Row 17 Para Karate is omitted.
 */
export const GLOBAL_CATEGORIES: GlobalCategorySeed[] = [
  // Kata 1–16: belt groups (KYU only)
  ...kataBelts(1, 'Mlajši Malčki', CategoryGender.MALE, 0, 8, MALCKI_KATA),
  ...kataBelts(2, 'Mlajše Malčice', CategoryGender.FEMALE, 0, 8, MALCKI_KATA),
  ...kataBelts(3, 'Starejši Malčki', CategoryGender.MALE, 8, 10, MALCKI_KATA),
  ...kataBelts(4, 'Starejše Malčice', CategoryGender.FEMALE, 8, 10, MALCKI_KATA),
  ...kataBelts(5, 'Mlajši Dečki', CategoryGender.MALE, 10, 12, KYU_KATA),
  ...kataBelts(6, 'Mlajše Deklice', CategoryGender.FEMALE, 10, 12, KYU_KATA),
  ...kataBelts(7, 'Starejši Dečki', CategoryGender.MALE, 12, 14, KYU_KATA),
  ...kataBelts(8, 'Starejše Deklice', CategoryGender.FEMALE, 12, 14, KYU_KATA),
  ...kataBelts(9, 'Mlajši Mladinci', CategoryGender.MALE, 13, 15, KYU_KATA),
  ...kataBelts(10, 'Starejši Mladinci', CategoryGender.MALE, 15, 17, KYU_KATA),
  ...kataBelts(11, 'Mlajše Mladinke', CategoryGender.FEMALE, 13, 15, KYU_KATA),
  ...kataBelts(12, 'Starejše Mladinke', CategoryGender.FEMALE, 15, 17, KYU_KATA),
  ...kataBelts(13, 'Člani', CategoryGender.MALE, 18, 35, KYU_KATA),
  ...kataBelts(14, 'Članice', CategoryGender.FEMALE, 18, 35, KYU_KATA),
  ...kataBelts(15, 'Starejši Člani', CategoryGender.MALE, 35, null, KYU_KATA),
  ...kataBelts(16, 'Starejše Članice', CategoryGender.FEMALE, 35, null, KYU_KATA),

  // Yiju kumite 18–29: A is the heavier weight group
  ...yijuAb(18, 'Malčki', CategoryGender.MALE, 0, 10, 30),
  ...yijuAb(19, 'Malčice', CategoryGender.FEMALE, 0, 10, 30),
  ...yijuCba(20, 'Mlajši Dečki', CategoryGender.MALE, 10, 12, 30, 40),
  ...yijuCba(21, 'Mlajše Deklice', CategoryGender.FEMALE, 10, 12, 30, 40),
  ...yijuAb(22, 'Starejši Dečki', CategoryGender.MALE, 12, 14, 45),
  ...yijuAb(23, 'Starejše Deklice', CategoryGender.FEMALE, 12, 14, 45),
  ...yijuAb(24, 'Mladinci', CategoryGender.MALE, 13, 17, 60),
  ...yijuAb(25, 'Mladinke', CategoryGender.FEMALE, 13, 17, 60),
  ...yijuCba(26, 'Člani', CategoryGender.MALE, 18, 35, 65, 75),
  ...yijuAb(27, 'Članice', CategoryGender.FEMALE, 18, 35, 60),
  {
    ...blank,
    name: labeled(28, 'Starejši Člani'),
    discipline: Discipline.YIJU_KUMITE,
    gender: CategoryGender.MALE,
    ageMin: 35,
    ageMax: null,
  },
  {
    ...blank,
    name: labeled(29, 'Starejše Članice'),
    discipline: Discipline.YIJU_KUMITE,
    gender: CategoryGender.FEMALE,
    ageMin: 35,
    ageMax: null,
  },

  kataTeam(30, 'Malčki/Malčice', 0, 10),
  kataTeam(31, 'Mlajši Dečki/Deklice', 10, 12),
  kataTeam(32, 'Starejši Dečki/Deklice', 12, 14),
  kataTeam(33, 'Mladinci/Mladinke', 13, 17),
  kataTeam(34, 'Člani/Članice', 18, 35),
  kataTeam(35, 'Starejši Člani/Članice', 35, null),

  yako(36, 'Malčki/Malčice', 0, 10, SubDiscipline.GOHON_IPPON_KUMITE, GOHON_ALL),
  yako(37, 'Mlajši Dečki/Deklice', 10, 12, SubDiscipline.GOHON_IPPON_KUMITE, GOHON),
  yako(38, 'Starejši Dečki/Deklice', 12, 14, SubDiscipline.GOHON_IPPON_KUMITE, GOHON),
  yako(39, 'Mladinci/Mladinke', 13, 17, SubDiscipline.GOHON_IPPON_KUMITE, GOHON),
  yako(40, 'Člani/Članice', 18, 35, SubDiscipline.GOHON_IPPON_KUMITE, GOHON),
  yako(41, 'Starejši Člani/Članice', 35, null, SubDiscipline.GOHON_IPPON_KUMITE, GOHON),

  yako(42, 'Mlajši Dečki/Deklice', 10, 12, SubDiscipline.SANBON_IPPON_KUMITE, SANBON),
  yako(43, 'Starejši Dečki/Deklice', 12, 14, SubDiscipline.SANBON_IPPON_KUMITE, SANBON),
  yako(44, 'Mladinci/Mladinke', 13, 17, SubDiscipline.SANBON_IPPON_KUMITE, SANBON),
  yako(45, 'Člani/Članice', 18, 35, SubDiscipline.SANBON_IPPON_KUMITE, SANBON),
  yako(46, 'Starejši Člani/Članice', 35, null, SubDiscipline.SANBON_IPPON_KUMITE, SANBON),

  yako(47, 'Mlajši Dečki/Deklice', 10, 12, SubDiscipline.KIHON_IPPON_KUMITE, KIHON),
  yako(48, 'Starejši Dečki/Deklice', 12, 14, SubDiscipline.KIHON_IPPON_KUMITE, KIHON),
  yako(49, 'Mladinci/Mladinke', 13, 17, SubDiscipline.KIHON_IPPON_KUMITE, KIHON),
  yako(50, 'Člani/Članice', 18, 35, SubDiscipline.KIHON_IPPON_KUMITE, KIHON),
  yako(51, 'Starejši Člani/Članice', 35, null, SubDiscipline.KIHON_IPPON_KUMITE, KIHON),

  yako(52, 'Mlajši Dečki/Deklice', 10, 12, SubDiscipline.DYU_IPPON_KUMITE, DYU),
  yako(53, 'Starejši Dečki/Deklice', 12, 14, SubDiscipline.DYU_IPPON_KUMITE, DYU),
  yako(54, 'Mladinci/Mladinke', 13, 17, SubDiscipline.DYU_IPPON_KUMITE, DYU),
  yako(55, 'Člani/Članice', 18, 35, SubDiscipline.DYU_IPPON_KUMITE, DYU),
  yako(56, 'Starejši Člani/Članice', 35, null, SubDiscipline.DYU_IPPON_KUMITE, DYU),
];

const INSERT_SQL = `
  INSERT INTO "categories" (
    "name",
    "discipline",
    "subDiscipline",
    "gender",
    "ageMin",
    "ageMax",
    "weightMin",
    "weightMax",
    "beltMin",
    "beltMax",
    "teamSize",
    "teamReservesSize",
    "clubId"
  )
  SELECT
    $1::character varying,
    $2::"public"."categories_discipline_enum",
    $3::"public"."categories_subdiscipline_enum",
    $4::"public"."categories_gender_enum",
    $5,
    $6,
    $7,
    $8,
    $9::"public"."categories_beltmin_enum",
    $10::"public"."categories_beltmax_enum",
    $11,
    $12,
    NULL
  WHERE NOT EXISTS (
    SELECT 1
    FROM "categories" existing
    WHERE existing."name" = $1::character varying
      AND existing."discipline" = $2::"public"."categories_discipline_enum"
      AND existing."clubId" IS NULL
  )
`;

const insertParams = (category: GlobalCategorySeed): unknown[] => [
  category.name,
  category.discipline,
  category.subDiscipline,
  category.gender,
  category.ageMin,
  category.ageMax,
  category.weightMin,
  category.weightMax,
  category.beltMin,
  category.beltMax,
  category.teamSize,
  category.teamReservesSize,
];

export const insertGlobalCategories = async (queryRunner: QueryRunner): Promise<void> => {
  for (const category of GLOBAL_CATEGORIES) {
    await queryRunner.query(INSERT_SQL, insertParams(category));
  }
};

export const deleteSeededGlobalCategories = async (queryRunner: QueryRunner): Promise<void> => {
  for (const category of GLOBAL_CATEGORIES) {
    await queryRunner.query(
      `DELETE FROM "categories" WHERE "name" = $1::character varying AND "discipline" = $2::"public"."categories_discipline_enum" AND "clubId" IS NULL`,
      [category.name, category.discipline],
    );
  }
};

const GLOBAL_CATEGORY_IDS = `SELECT id FROM "categories" WHERE "clubId" IS NULL`;

export const deleteAllGlobalCategories = async (queryRunner: QueryRunner): Promise<void> => {
  await queryRunner.query(`UPDATE "registrations" SET "teamId" = NULL WHERE "categoryId" IN (${GLOBAL_CATEGORY_IDS})`);
  await queryRunner.query(`DELETE FROM "teams" WHERE "categoryId" IN (${GLOBAL_CATEGORY_IDS})`);
  await queryRunner.query(`DELETE FROM "registrations" WHERE "categoryId" IN (${GLOBAL_CATEGORY_IDS})`);
  await queryRunner.query(`DELETE FROM "schedules" WHERE "categoryId" IN (${GLOBAL_CATEGORY_IDS})`);
  await queryRunner.query(`DELETE FROM "tournament_categories" WHERE "categoryId" IN (${GLOBAL_CATEGORY_IDS})`);
  await queryRunner.query(`DELETE FROM "categories" WHERE "clubId" IS NULL`);
};
