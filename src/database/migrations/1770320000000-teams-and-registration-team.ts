import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class TeamsAndRegistrationTeam1770320000000 implements MigrationInterface {
  name = 'TeamsAndRegistrationTeam1770320000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "teams" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tournamentId" uuid NOT NULL, "categoryId" uuid NOT NULL, "clubId" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_teams_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "teams" ADD CONSTRAINT "FK_teams_tournamentId" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "teams" ADD CONSTRAINT "FK_teams_categoryId" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "teams" ADD CONSTRAINT "FK_teams_clubId" FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(`CREATE TYPE "public"."registrations_teamrole_enum" AS ENUM('starter', 'reserve')`);
    await queryRunner.query(`ALTER TABLE "registrations" ADD "teamId" uuid`);
    await queryRunner.query(`ALTER TABLE "registrations" ADD "teamRole" "public"."registrations_teamrole_enum"`);
    await queryRunner.query(
      `ALTER TABLE "registrations" ADD CONSTRAINT "FK_registrations_teamId" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "registrations" DROP CONSTRAINT "FK_registrations_teamId"`);
    await queryRunner.query(`ALTER TABLE "registrations" DROP COLUMN "teamRole"`);
    await queryRunner.query(`ALTER TABLE "registrations" DROP COLUMN "teamId"`);
    await queryRunner.query(`DROP TYPE "public"."registrations_teamrole_enum"`);
    await queryRunner.query(`ALTER TABLE "teams" DROP CONSTRAINT "FK_teams_clubId"`);
    await queryRunner.query(`ALTER TABLE "teams" DROP CONSTRAINT "FK_teams_categoryId"`);
    await queryRunner.query(`ALTER TABLE "teams" DROP CONSTRAINT "FK_teams_tournamentId"`);
    await queryRunner.query(`DROP TABLE "teams"`);
  }
}
