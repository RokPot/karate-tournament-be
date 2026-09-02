import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class CategoryGenderScalar1770270000000 implements MigrationInterface {
  name = 'CategoryGenderScalar1770270000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "categories" ADD "genderScalar" "public"."categories_gender_enum"`);

    await queryRunner.query(`
      UPDATE "categories"
      SET "genderScalar" = CASE
        WHEN "gender" IS NULL THEN NULL
        WHEN cardinality("gender") = 0 THEN NULL
        WHEN cardinality("gender") = 1 THEN ("gender")[1]
        ELSE NULL
      END
    `);

    await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "gender"`);
    await queryRunner.query(`ALTER TABLE "categories" RENAME COLUMN "genderScalar" TO "gender"`);
    await queryRunner.query(`ALTER TABLE "categories" ALTER COLUMN "gender" DROP NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "categories" ADD "genderArray" "public"."categories_gender_enum" array`);

    await queryRunner.query(`
      UPDATE "categories"
      SET "genderArray" = CASE
        WHEN "gender" IS NULL THEN NULL
        ELSE ARRAY["gender"]::"public"."categories_gender_enum"[]
      END
    `);

    await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "gender"`);
    await queryRunner.query(`ALTER TABLE "categories" RENAME COLUMN "genderArray" TO "gender"`);
  }
}
