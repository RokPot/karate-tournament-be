import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class TournamentStatus1770330000000 implements MigrationInterface {
  name = 'TournamentStatus1770330000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."tournaments_status_enum" AS ENUM('pending', 'approved', 'declined')`,
    );
    await queryRunner.query(`ALTER TABLE "tournaments" ADD "status" "public"."tournaments_status_enum"`);
    await queryRunner.query(`UPDATE "tournaments" SET "status" = 'approved' WHERE "status" IS NULL`);
    await queryRunner.query(`ALTER TABLE "tournaments" ALTER COLUMN "status" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "tournaments" ADD "reviewedAt" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "tournaments" ADD "reviewedBy" uuid`);
    await queryRunner.query(`ALTER TABLE "tournaments" ADD "reviewNote" character varying(1000)`);
    await queryRunner.query(
      `ALTER TABLE "tournaments" ADD CONSTRAINT "FK_tournaments_reviewedBy" FOREIGN KEY ("reviewedBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tournaments" DROP CONSTRAINT "FK_tournaments_reviewedBy"`);
    await queryRunner.query(`ALTER TABLE "tournaments" DROP COLUMN "reviewNote"`);
    await queryRunner.query(`ALTER TABLE "tournaments" DROP COLUMN "reviewedBy"`);
    await queryRunner.query(`ALTER TABLE "tournaments" DROP COLUMN "reviewedAt"`);
    await queryRunner.query(`ALTER TABLE "tournaments" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "public"."tournaments_status_enum"`);
  }
}
