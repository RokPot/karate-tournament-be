import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class TournamentLifecycleStatus1770340000000 implements MigrationInterface {
  name = 'TournamentLifecycleStatus1770340000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."tournaments_status_enum_new" AS ENUM('pending', 'approved', 'declined', 'in_progress', 'ended')`,
    );
    await queryRunner.query(
      `ALTER TABLE "tournaments" ALTER COLUMN "status" TYPE "public"."tournaments_status_enum_new" USING "status"::text::"public"."tournaments_status_enum_new"`,
    );
    await queryRunner.query(`DROP TYPE "public"."tournaments_status_enum"`);
    await queryRunner.query(`ALTER TYPE "public"."tournaments_status_enum_new" RENAME TO "tournaments_status_enum"`);
    await queryRunner.query(`ALTER TABLE "tournaments" ADD "startedAt" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "tournaments" ADD "startedBy" uuid`);
    await queryRunner.query(`ALTER TABLE "tournaments" ADD "endedAt" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "tournaments" ADD "endedBy" uuid`);
    await queryRunner.query(
      `ALTER TABLE "tournaments" ADD CONSTRAINT "FK_tournaments_startedBy" FOREIGN KEY ("startedBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tournaments" ADD CONSTRAINT "FK_tournaments_endedBy" FOREIGN KEY ("endedBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tournaments" DROP CONSTRAINT "FK_tournaments_endedBy"`);
    await queryRunner.query(`ALTER TABLE "tournaments" DROP CONSTRAINT "FK_tournaments_startedBy"`);
    await queryRunner.query(`ALTER TABLE "tournaments" DROP COLUMN "endedBy"`);
    await queryRunner.query(`ALTER TABLE "tournaments" DROP COLUMN "endedAt"`);
    await queryRunner.query(`ALTER TABLE "tournaments" DROP COLUMN "startedBy"`);
    await queryRunner.query(`ALTER TABLE "tournaments" DROP COLUMN "startedAt"`);
    await queryRunner.query(
      `UPDATE "tournaments" SET "status" = 'approved' WHERE "status" IN ('in_progress', 'ended')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tournaments_status_enum_old" AS ENUM('pending', 'approved', 'declined')`,
    );
    await queryRunner.query(
      `ALTER TABLE "tournaments" ALTER COLUMN "status" TYPE "public"."tournaments_status_enum_old" USING "status"::text::"public"."tournaments_status_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."tournaments_status_enum"`);
    await queryRunner.query(`ALTER TYPE "public"."tournaments_status_enum_old" RENAME TO "tournaments_status_enum"`);
  }
}
