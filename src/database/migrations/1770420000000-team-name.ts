import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class TeamName1770420000000 implements MigrationInterface {
  name = 'TeamName1770420000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "teams" ADD "name" character varying(255)`);
    await queryRunner.query(`
      UPDATE "teams" AS t
      SET "name" = COALESCE(c.name, 'Team')
      FROM "clubs" AS c
      WHERE t."clubId" = c.id
    `);
    await queryRunner.query(`UPDATE "teams" SET "name" = 'Team' WHERE "name" IS NULL`);
    await queryRunner.query(`
      WITH ranked AS (
        SELECT
          id,
          "name",
          ROW_NUMBER() OVER (
            PARTITION BY "tournamentId", "categoryId", COALESCE("clubId"::text, '')
            ORDER BY "createdAt" ASC, id ASC
          ) AS rn
        FROM "teams"
      )
      UPDATE "teams" AS t
      SET "name" = CASE
        WHEN r.rn <= 27 THEN LEFT(r.name, 253) || ' ' || CHR((63 + r.rn)::integer)
        ELSE LEFT(r.name, GREATEST(1, 254 - LENGTH((r.rn - 1)::text))) || ' ' || (r.rn - 1)::text
      END
      FROM ranked r
      WHERE t.id = r.id AND r.rn > 1
    `);
    await queryRunner.query(`ALTER TABLE "teams" ALTER COLUMN "name" SET NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "teams" DROP COLUMN "name"`);
  }
}
