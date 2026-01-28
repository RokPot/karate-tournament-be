import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class Migration1769369439202 implements MigrationInterface {
  name = 'Migration1769369439202';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT "FK_ac016770cbcc3750278d97ccd0a"`);
    await queryRunner.query(
      `CREATE TABLE "tournament_categories" ("tournamentId" uuid NOT NULL, "categoryId" uuid NOT NULL, CONSTRAINT "PK_fd00ab679b02cdc58731ae87217" PRIMARY KEY ("tournamentId", "categoryId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c737e3711b68b14e94360f7fbc" ON "tournament_categories" ("tournamentId") `,
    );
    await queryRunner.query(`CREATE INDEX "IDX_a62f19491dcab8aa59a32f401d" ON "tournament_categories" ("categoryId") `);
    await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "tournamentId"`);
    await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "tatami"`);
    await queryRunner.query(
      `ALTER TYPE "public"."categories_discipline_enum" RENAME TO "categories_discipline_enum_old"`,
    );
    await queryRunner.query(`CREATE TYPE "public"."categories_discipline_enum" AS ENUM('kata', 'kumite', 'yako-soku')`);
    await queryRunner.query(
      `ALTER TABLE "categories" ALTER COLUMN "discipline" TYPE "public"."categories_discipline_enum" USING "discipline"::"text"::"public"."categories_discipline_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."categories_discipline_enum_old"`);
    await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "gender"`);
    await queryRunner.query(`DROP TYPE "public"."categories_gender_enum"`);
    await queryRunner.query(`CREATE TYPE "public"."categories_gender_enum" AS ENUM('male', 'female')`);
    await queryRunner.query(
      `ALTER TABLE "categories" ADD "gender" "public"."categories_gender_enum" array NOT NULL DEFAULT '{}'`,
    );
    await queryRunner.query(`ALTER TYPE "public"."users_roles_enum" RENAME TO "users_roles_enum_old"`);
    await queryRunner.query(
      `CREATE TYPE "public"."users_roles_enum" AS ENUM('admin', 'organizer', 'coach', 'competitor', 'judge', 'staff')`,
    );
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "roles" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "roles" TYPE "public"."users_roles_enum"[] USING "roles"::"text"::"public"."users_roles_enum"[]`,
    );
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "roles" SET DEFAULT '{}'`);
    await queryRunner.query(`DROP TYPE "public"."users_roles_enum_old"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_7f6ab5518f363f8fa0f6bd2d0a" ON "registrations" ("userId", "tournamentId", "categoryId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "tournament_categories" ADD CONSTRAINT "FK_c737e3711b68b14e94360f7fbc6" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "tournament_categories" ADD CONSTRAINT "FK_a62f19491dcab8aa59a32f401db" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tournament_categories" DROP CONSTRAINT "FK_a62f19491dcab8aa59a32f401db"`);
    await queryRunner.query(`ALTER TABLE "tournament_categories" DROP CONSTRAINT "FK_c737e3711b68b14e94360f7fbc6"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_7f6ab5518f363f8fa0f6bd2d0a"`);
    await queryRunner.query(
      `CREATE TYPE "public"."users_roles_enum_old" AS ENUM('organizer', 'coach', 'competitor', 'judge', 'staff')`,
    );
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "roles" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "roles" TYPE "public"."users_roles_enum_old"[] USING "roles"::"text"::"public"."users_roles_enum_old"[]`,
    );
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "roles" SET DEFAULT '{}'`);
    await queryRunner.query(`DROP TYPE "public"."users_roles_enum"`);
    await queryRunner.query(`ALTER TYPE "public"."users_roles_enum_old" RENAME TO "users_roles_enum"`);
    await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "gender"`);
    await queryRunner.query(`CREATE TYPE "public"."categories_gender_enum" AS ENUM('male', 'female', 'mixed')`);
    await queryRunner.query(`ALTER TABLE "categories" ADD "gender" "public"."categories_gender_enum" NOT NULL`);
    await queryRunner.query(`CREATE TYPE "public"."categories_discipline_enum_old" AS ENUM('kata', 'kumite')`);
    await queryRunner.query(
      `ALTER TABLE "categories" ALTER COLUMN "discipline" TYPE "public"."categories_discipline_enum_old" USING "discipline"::"text"::"public"."categories_discipline_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."categories_discipline_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."categories_discipline_enum_old" RENAME TO "categories_discipline_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "categories" ADD "tatami" integer`);
    await queryRunner.query(`ALTER TABLE "categories" ADD "tournamentId" uuid NOT NULL`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a62f19491dcab8aa59a32f401d"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c737e3711b68b14e94360f7fbc"`);
    await queryRunner.query(`DROP TABLE "tournament_categories"`);
    await queryRunner.query(
      `ALTER TABLE "categories" ADD CONSTRAINT "FK_ac016770cbcc3750278d97ccd0a" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
