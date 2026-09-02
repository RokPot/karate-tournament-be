import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class RegistrationClubNullable1770235200000 implements MigrationInterface {
  name = 'RegistrationClubNullable1770235200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "registrations" ALTER COLUMN "clubId" DROP NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "registrations" ALTER COLUMN "clubId" SET NOT NULL`);
  }
}
