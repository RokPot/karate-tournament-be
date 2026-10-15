import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class RosterContinue1770430000000 implements MigrationInterface {
  name = 'RosterContinue1770430000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "registration_submissions" ADD "updatedAt" TIMESTAMP`);
    await queryRunner.query(
      `UPDATE "registration_submissions" SET "updatedAt" = "createdAt" WHERE "updatedAt" IS NULL`,
    );
    await queryRunner.query(`ALTER TABLE "registration_submissions" ALTER COLUMN "updatedAt" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "registration_submissions" ALTER COLUMN "updatedAt" SET DEFAULT now()`);

    await queryRunner.query(`
      CREATE TABLE "registration_roster_otps" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tournamentId" uuid NOT NULL,
        "email" character varying(255) NOT NULL,
        "clubId" uuid,
        "clubName" character varying(255),
        "codeHash" character varying(64) NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "consumedAt" TIMESTAMP,
        "attemptCount" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_registration_roster_otps_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_registration_roster_otps_identity" ON "registration_roster_otps" ("tournamentId", "email")`,
    );
    await queryRunner.query(
      `ALTER TABLE "registration_roster_otps" ADD CONSTRAINT "FK_registration_roster_otps_tournamentId" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(`
      CREATE TABLE "registration_roster_sessions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tokenHash" character varying(64) NOT NULL,
        "tournamentId" uuid NOT NULL,
        "email" character varying(255) NOT NULL,
        "clubId" uuid,
        "clubName" character varying(255),
        "expiresAt" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_registration_roster_sessions_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_registration_roster_sessions_tokenHash" UNIQUE ("tokenHash")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_registration_roster_sessions_tokenHash" ON "registration_roster_sessions" ("tokenHash")`,
    );
    await queryRunner.query(
      `ALTER TABLE "registration_roster_sessions" ADD CONSTRAINT "FK_registration_roster_sessions_tournamentId" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "registration_roster_sessions" DROP CONSTRAINT "FK_registration_roster_sessions_tournamentId"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_registration_roster_sessions_tokenHash"`);
    await queryRunner.query(`DROP TABLE "registration_roster_sessions"`);
    await queryRunner.query(
      `ALTER TABLE "registration_roster_otps" DROP CONSTRAINT "FK_registration_roster_otps_tournamentId"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_registration_roster_otps_identity"`);
    await queryRunner.query(`DROP TABLE "registration_roster_otps"`);
    await queryRunner.query(`ALTER TABLE "registration_submissions" DROP COLUMN "updatedAt"`);
  }
}
