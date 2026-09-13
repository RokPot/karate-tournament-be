import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class TeamMembers1770350000000 implements MigrationInterface {
  name = 'TeamMembers1770350000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "team_members" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "teamId" uuid NOT NULL, "registrationId" uuid NOT NULL, "role" "public"."registrations_teamrole_enum" NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_team_members_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_team_members_teamId_registrationId" ON "team_members" ("teamId", "registrationId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_members" ADD CONSTRAINT "FK_team_members_teamId" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "team_members" ADD CONSTRAINT "FK_team_members_registrationId" FOREIGN KEY ("registrationId") REFERENCES "registrations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `INSERT INTO "team_members" ("teamId", "registrationId", "role") SELECT "teamId", "id", "teamRole" FROM "registrations" WHERE "teamId" IS NOT NULL AND "teamRole" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "team_members" DROP CONSTRAINT "FK_team_members_registrationId"`);
    await queryRunner.query(`ALTER TABLE "team_members" DROP CONSTRAINT "FK_team_members_teamId"`);
    await queryRunner.query(`DROP TABLE "team_members"`);
  }
}
