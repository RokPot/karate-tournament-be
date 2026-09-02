import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class TournamentCategorySortOrder1770290000000 implements MigrationInterface {
  name = 'TournamentCategorySortOrder1770290000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tournament_categories" ADD "sortOrder" integer`);
    await queryRunner.query(`
      WITH ranked AS (
        SELECT
          "tournamentId",
          "categoryId",
          ROW_NUMBER() OVER (PARTITION BY "tournamentId" ORDER BY "categoryId") - 1 AS "sortOrder"
        FROM "tournament_categories"
      )
      UPDATE "tournament_categories" tc
      SET "sortOrder" = ranked."sortOrder"
      FROM ranked
      WHERE tc."tournamentId" = ranked."tournamentId"
        AND tc."categoryId" = ranked."categoryId"
    `);
    await queryRunner.query(`ALTER TABLE "tournament_categories" ALTER COLUMN "sortOrder" SET NOT NULL`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_tournament_categories_tournament_sort_order" ON "tournament_categories" ("tournamentId", "sortOrder") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_tournament_categories_tournament_sort_order"`);
    await queryRunner.query(`ALTER TABLE "tournament_categories" DROP COLUMN "sortOrder"`);
  }
}
