import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class TournamentFees1770380000000 implements MigrationInterface {
  name = 'TournamentFees1770380000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tournaments" ADD "feeOneCategory" numeric(10,2) NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "tournaments" ADD "feeTwoCategories" numeric(10,2) NOT NULL DEFAULT 0`);
    await queryRunner.query(
      `ALTER TABLE "tournaments" ADD "feeThreeOrMoreCategories" numeric(10,2) NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(`ALTER TABLE "tournaments" ADD "feeTeam" numeric(10,2) NOT NULL DEFAULT 0`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tournaments" DROP COLUMN "feeTeam"`);
    await queryRunner.query(`ALTER TABLE "tournaments" DROP COLUMN "feeThreeOrMoreCategories"`);
    await queryRunner.query(`ALTER TABLE "tournaments" DROP COLUMN "feeTwoCategories"`);
    await queryRunner.query(`ALTER TABLE "tournaments" DROP COLUMN "feeOneCategory"`);
  }
}
