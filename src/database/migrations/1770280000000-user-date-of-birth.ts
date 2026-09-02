import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class UserDateOfBirth1770280000000 implements MigrationInterface {
  name = 'UserDateOfBirth1770280000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "birthDate" TO "dateOfBirth"`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "dateOfBirth" TYPE date USING "dateOfBirth"::date`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "dateOfBirth" TYPE TIMESTAMP USING "dateOfBirth"::timestamp`);
    await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "dateOfBirth" TO "birthDate"`);
  }
}
