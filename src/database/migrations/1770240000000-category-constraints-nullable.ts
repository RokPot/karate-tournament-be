import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class CategoryConstraintsNullable1770240000000 implements MigrationInterface {
  name = 'CategoryConstraintsNullable1770240000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "categories" ALTER COLUMN "ageMin" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "categories" ALTER COLUMN "ageMax" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "categories" ALTER COLUMN "beltMin" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "categories" ALTER COLUMN "beltMax" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "categories" ALTER COLUMN "gender" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "categories" ALTER COLUMN "gender" DROP DEFAULT`);
    await queryRunner.query(
      `UPDATE "categories" SET "gender" = NULL WHERE "gender" = '{}'::"public"."categories_gender_enum"[]`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE "categories" SET "gender" = '{}' WHERE "gender" IS NULL`);
    await queryRunner.query(`ALTER TABLE "categories" ALTER COLUMN "gender" SET DEFAULT '{}'`);
    await queryRunner.query(`ALTER TABLE "categories" ALTER COLUMN "gender" SET NOT NULL`);
    await queryRunner.query(`UPDATE "categories" SET "beltMax" = 'white' WHERE "beltMax" IS NULL`);
    await queryRunner.query(`ALTER TABLE "categories" ALTER COLUMN "beltMax" SET NOT NULL`);
    await queryRunner.query(`UPDATE "categories" SET "beltMin" = 'white' WHERE "beltMin" IS NULL`);
    await queryRunner.query(`ALTER TABLE "categories" ALTER COLUMN "beltMin" SET NOT NULL`);
    await queryRunner.query(`UPDATE "categories" SET "ageMax" = 0 WHERE "ageMax" IS NULL`);
    await queryRunner.query(`ALTER TABLE "categories" ALTER COLUMN "ageMax" SET NOT NULL`);
    await queryRunner.query(`UPDATE "categories" SET "ageMin" = 0 WHERE "ageMin" IS NULL`);
    await queryRunner.query(`ALTER TABLE "categories" ALTER COLUMN "ageMin" SET NOT NULL`);
  }
}
