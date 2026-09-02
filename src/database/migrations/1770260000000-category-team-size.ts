import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class CategoryTeamSize1770260000000 implements MigrationInterface {
  name = 'CategoryTeamSize1770260000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "categories" ADD "teamSize" integer NULL`);
    await queryRunner.query(`ALTER TABLE "categories" ADD "teamReservesSize" integer NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "teamReservesSize"`);
    await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "teamSize"`);
  }
}
