import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class CategoryClubId1770310000000 implements MigrationInterface {
  name = 'CategoryClubId1770310000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "categories" ADD "clubId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "categories" ADD CONSTRAINT "FK_categories_clubId" FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT "FK_categories_clubId"`);
    await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "clubId"`);
  }
}
