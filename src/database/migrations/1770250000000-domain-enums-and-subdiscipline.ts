import { type MigrationInterface, type QueryRunner } from 'typeorm';

const NEW_BELT_VALUES = `'10-kyu', '9-kyu', '8-kyu', '7-kyu', '6-kyu', '5-kyu', '4-kyu', '3-kyu', '2-kyu', '1-kyu', '1-dan', '2-dan', '3-dan', '4-dan', '5-dan', '6-dan', '7-dan', '8-dan', '9-dan', '10-dan'`;

const OLD_BELT_VALUES = `'white', 'yellow', 'orange', 'green', 'blue', 'brown', 'black', 'black_dan_1', 'black_dan_2', 'black_dan_3', 'black_dan_4', 'black_dan_5', 'black_dan_6', 'black_dan_7', 'black_dan_8', 'black_dan_9', 'black_dan_10'`;

const BELT_UP_CASE = `
  CASE "column"::text
    WHEN 'white' THEN '10-kyu'
    WHEN 'yellow' THEN '9-kyu'
    WHEN 'orange' THEN '8-kyu'
    WHEN 'green' THEN '7-kyu'
    WHEN 'blue' THEN '6-kyu'
    WHEN 'brown' THEN '4-kyu'
    WHEN 'black' THEN '1-dan'
    WHEN 'black_dan_1' THEN '1-dan'
    WHEN 'black_dan_2' THEN '2-dan'
    WHEN 'black_dan_3' THEN '3-dan'
    WHEN 'black_dan_4' THEN '4-dan'
    WHEN 'black_dan_5' THEN '5-dan'
    WHEN 'black_dan_6' THEN '6-dan'
    WHEN 'black_dan_7' THEN '7-dan'
    WHEN 'black_dan_8' THEN '8-dan'
    WHEN 'black_dan_9' THEN '9-dan'
    WHEN 'black_dan_10' THEN '10-dan'
    ELSE "column"::text
  END
`;

const BELT_DOWN_CASE = `
  CASE "column"::text
    WHEN '10-kyu' THEN 'white'
    WHEN '9-kyu' THEN 'yellow'
    WHEN '8-kyu' THEN 'orange'
    WHEN '7-kyu' THEN 'green'
    WHEN '6-kyu' THEN 'blue'
    WHEN '5-kyu' THEN 'green'
    WHEN '4-kyu' THEN 'brown'
    WHEN '3-kyu' THEN 'brown'
    WHEN '2-kyu' THEN 'brown'
    WHEN '1-kyu' THEN 'brown'
    WHEN '1-dan' THEN 'black_dan_1'
    WHEN '2-dan' THEN 'black_dan_2'
    WHEN '3-dan' THEN 'black_dan_3'
    WHEN '4-dan' THEN 'black_dan_4'
    WHEN '5-dan' THEN 'black_dan_5'
    WHEN '6-dan' THEN 'black_dan_6'
    WHEN '7-dan' THEN 'black_dan_7'
    WHEN '8-dan' THEN 'black_dan_8'
    WHEN '9-dan' THEN 'black_dan_9'
    WHEN '10-dan' THEN 'black_dan_10'
    ELSE "column"::text
  END
`;

async function migrateBeltEnum(
  queryRunner: QueryRunner,
  table: string,
  column: string,
  enumName: string,
  direction: 'up' | 'down',
): Promise<void> {
  const oldEnumName = `${enumName}_old`;
  const caseExpr = (direction === 'up' ? BELT_UP_CASE : BELT_DOWN_CASE).replace(/"column"/g, `"${column}"`);
  const newValues = direction === 'up' ? NEW_BELT_VALUES : OLD_BELT_VALUES;

  await queryRunner.query(`ALTER TYPE "public"."${enumName}" RENAME TO "${oldEnumName}"`);
  await queryRunner.query(`CREATE TYPE "public"."${enumName}" AS ENUM(${newValues})`);
  await queryRunner.query(
    `ALTER TABLE "${table}" ALTER COLUMN "${column}" TYPE "public"."${enumName}" USING (${caseExpr})::"public"."${enumName}"`,
  );
  await queryRunner.query(`DROP TYPE "public"."${oldEnumName}"`);
}

export class DomainEnumsAndSubdiscipline1770250000000 implements MigrationInterface {
  name = 'DomainEnumsAndSubdiscipline1770250000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Extend discipline enum
    await queryRunner.query(
      `ALTER TYPE "public"."categories_discipline_enum" RENAME TO "categories_discipline_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."categories_discipline_enum" AS ENUM('kata', 'kumite', 'yako-soku', 'kata-team', 'yako-soku-kumite', 'yiju-kumite', 'kumite-team')`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" ALTER COLUMN "discipline" TYPE "public"."categories_discipline_enum" USING "discipline"::"text"::"public"."categories_discipline_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."categories_discipline_enum_old"`);

    // Remap belt enums
    await migrateBeltEnum(queryRunner, 'users', 'beltLevel', 'users_beltlevel_enum', 'up');
    await migrateBeltEnum(queryRunner, 'categories', 'beltMin', 'categories_beltmin_enum', 'up');
    await migrateBeltEnum(queryRunner, 'categories', 'beltMax', 'categories_beltmax_enum', 'up');

    // Add subDiscipline column
    await queryRunner.query(
      `CREATE TYPE "public"."categories_subdiscipline_enum" AS ENUM('gohon-ippon-kumite', 'sanbon-ippon-kumite', 'kihon-ippon-kumite', 'dyu-ippon-kumite')`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" ADD "subDiscipline" "public"."categories_subdiscipline_enum" NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "subDiscipline"`);
    await queryRunner.query(`DROP TYPE "public"."categories_subdiscipline_enum"`);

    await migrateBeltEnum(queryRunner, 'categories', 'beltMax', 'categories_beltmax_enum', 'down');
    await migrateBeltEnum(queryRunner, 'categories', 'beltMin', 'categories_beltmin_enum', 'down');
    await migrateBeltEnum(queryRunner, 'users', 'beltLevel', 'users_beltlevel_enum', 'down');

    await queryRunner.query(
      `ALTER TYPE "public"."categories_discipline_enum" RENAME TO "categories_discipline_enum_old"`,
    );
    await queryRunner.query(`CREATE TYPE "public"."categories_discipline_enum" AS ENUM('kata', 'kumite', 'yako-soku')`);
    await queryRunner.query(
      `ALTER TABLE "categories" ALTER COLUMN "discipline" TYPE "public"."categories_discipline_enum" USING "discipline"::"text"::"public"."categories_discipline_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."categories_discipline_enum_old"`);
  }
}
