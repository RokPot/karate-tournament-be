import { type MigrationInterface, type QueryRunner } from 'typeorm';

import { GLOBAL_CATEGORIES } from '../seeds/global-categories';

export class SeedGlobalCategories1770390000000 implements MigrationInterface {
  name = 'SeedGlobalCategories1770390000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const category of GLOBAL_CATEGORIES) {
      await queryRunner.query(
        `
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
            NULL,
            $3::"public"."categories_gender_enum",
            $4,
            $5,
            $6,
            $7,
            $8::"public"."categories_beltmin_enum",
            $9::"public"."categories_beltmax_enum",
            $10,
            $11,
            NULL
          WHERE NOT EXISTS (
            SELECT 1
            FROM "categories" existing
            WHERE existing."name" = $1::character varying
              AND existing."discipline" = $2::"public"."categories_discipline_enum"
              AND existing."clubId" IS NULL
          )
        `,
        [
          category.name,
          category.discipline,
          category.gender,
          category.ageMin,
          category.ageMax,
          category.weightMin,
          category.weightMax,
          category.beltMin,
          category.beltMax,
          category.teamSize,
          category.teamReservesSize,
        ],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const category of GLOBAL_CATEGORIES) {
      await queryRunner.query(
        `DELETE FROM "categories" WHERE "name" = $1::character varying AND "discipline" = $2::"public"."categories_discipline_enum" AND "clubId" IS NULL`,
        [category.name, category.discipline],
      );
    }
  }
}
