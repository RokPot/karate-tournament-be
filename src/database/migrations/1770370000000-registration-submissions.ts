import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class RegistrationSubmissions1770370000000 implements MigrationInterface {
  name = 'RegistrationSubmissions1770370000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "registration_submissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tournamentId" uuid NOT NULL, "email" character varying(255) NOT NULL, "firstName" character varying(100) NOT NULL, "lastName" character varying(100) NOT NULL, "clubName" character varying(255), "clubId" uuid, "registeredByUserId" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_registration_submissions_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_registration_submissions_tournamentId" ON "registration_submissions" ("tournamentId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "registration_submissions" ADD CONSTRAINT "FK_registration_submissions_tournamentId" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "registration_submissions" ADD CONSTRAINT "FK_registration_submissions_clubId" FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "registration_submissions" ADD CONSTRAINT "FK_registration_submissions_registeredByUserId" FOREIGN KEY ("registeredByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(`ALTER TABLE "registrations" ADD "submissionId" uuid`);
    await queryRunner.query(`CREATE INDEX "IDX_registrations_submissionId" ON "registrations" ("submissionId")`);
    await queryRunner.query(
      `ALTER TABLE "registrations" ADD CONSTRAINT "FK_registrations_submissionId" FOREIGN KEY ("submissionId") REFERENCES "registration_submissions"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "registrations" DROP CONSTRAINT "FK_registrations_submissionId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_registrations_submissionId"`);
    await queryRunner.query(`ALTER TABLE "registrations" DROP COLUMN "submissionId"`);
    await queryRunner.query(
      `ALTER TABLE "registration_submissions" DROP CONSTRAINT "FK_registration_submissions_registeredByUserId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "registration_submissions" DROP CONSTRAINT "FK_registration_submissions_clubId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "registration_submissions" DROP CONSTRAINT "FK_registration_submissions_tournamentId"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_registration_submissions_tournamentId"`);
    await queryRunner.query(`DROP TABLE "registration_submissions"`);
  }
}
