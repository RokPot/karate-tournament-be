import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class CategoryFeeders1770440000000 implements MigrationInterface {
  name = 'CategoryFeeders1770440000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "categories" ADD "feederParticipantLimit" integer`);
    await queryRunner.query(`
      CREATE TABLE "category_feeders" (
        "categoryId" uuid NOT NULL,
        "feederCategoryId" uuid NOT NULL,
        CONSTRAINT "PK_category_feeders" PRIMARY KEY ("categoryId", "feederCategoryId"),
        CONSTRAINT "FK_category_feeders_categoryId" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_category_feeders_feederCategoryId" FOREIGN KEY ("feederCategoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "category_feeders" DROP CONSTRAINT "FK_category_feeders_feederCategoryId"`);
    await queryRunner.query(`ALTER TABLE "category_feeders" DROP CONSTRAINT "FK_category_feeders_categoryId"`);
    await queryRunner.query(`DROP TABLE "category_feeders"`);
    await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "feederParticipantLimit"`);
  }
}
