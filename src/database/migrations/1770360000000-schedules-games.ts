import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class SchedulesGames1770360000000 implements MigrationInterface {
  name = 'SchedulesGames1770360000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "scores" DROP CONSTRAINT "FK_9012285dd168d361368836fa967"`);
    await queryRunner.query(`ALTER TABLE "scores" DROP CONSTRAINT "FK_c0508b319d67f890b4118099680"`);
    await queryRunner.query(`ALTER TABLE "scores" DROP CONSTRAINT "FK_f83bc655e50581e73b992c7668c"`);
    await queryRunner.query(`ALTER TABLE "matches" DROP CONSTRAINT "FK_d843865ffa37082458705576aeb"`);
    await queryRunner.query(`ALTER TABLE "matches" DROP CONSTRAINT "FK_e04a857e18cf03d40c53973a67f"`);
    await queryRunner.query(`ALTER TABLE "matches" DROP CONSTRAINT "FK_6db659634158a7be6ff856fa6fc"`);
    await queryRunner.query(`ALTER TABLE "matches" DROP CONSTRAINT "FK_eb5e9984be5b3bd5c8e3ef2d9ec"`);
    await queryRunner.query(`ALTER TABLE "brackets" DROP CONSTRAINT "FK_b413fa1a287918cf558262d9dc7"`);
    await queryRunner.query(`ALTER TABLE "brackets" DROP CONSTRAINT "FK_8bbbe0461bbd16b3de6e7979640"`);
    await queryRunner.query(`DROP TABLE "scores"`);
    await queryRunner.query(`DROP TABLE "matches"`);
    await queryRunner.query(`DROP TABLE "brackets"`);

    await queryRunner.query(`CREATE TYPE "public"."schedules_kind_enum" AS ENUM('single_elimination')`);
    await queryRunner.query(
      `CREATE TABLE "schedules" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tournamentId" uuid NOT NULL, "categoryId" uuid NOT NULL, "kind" "public"."schedules_kind_enum" NOT NULL, "size" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_schedules_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_schedules_tournamentId_categoryId" ON "schedules" ("tournamentId", "categoryId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "schedules" ADD CONSTRAINT "FK_schedules_tournamentId" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "schedules" ADD CONSTRAINT "FK_schedules_categoryId" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    await queryRunner.query(`CREATE TYPE "public"."games_slotkind_enum" AS ENUM('item', 'bye', 'tbd')`);
    await queryRunner.query(`CREATE TYPE "public"."games_slotoutcome_enum" AS ENUM('winner', 'loser')`);
    await queryRunner.query(`CREATE TYPE "public"."games_winnerside_enum" AS ENUM('item', 'item2')`);
    await queryRunner.query(
      `CREATE TABLE "games" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "scheduleId" uuid NOT NULL, "key" character varying(64) NOT NULL, "isThirdPlace" boolean NOT NULL DEFAULT false, "isBye" boolean NOT NULL DEFAULT false, "winnerSide" "public"."games_winnerside_enum", "slotAKind" "public"."games_slotkind_enum" NOT NULL, "slotBKind" "public"."games_slotkind_enum" NOT NULL, "slotACompetitorId" uuid, "slotBCompetitorId" uuid, "slotAFromGameId" uuid, "slotBFromGameId" uuid, "slotAOutcome" "public"."games_slotoutcome_enum", "slotBOutcome" "public"."games_slotoutcome_enum", "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_games_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_games_scheduleId_key" ON "games" ("scheduleId", "key")`);
    await queryRunner.query(
      `ALTER TABLE "games" ADD CONSTRAINT "FK_games_scheduleId" FOREIGN KEY ("scheduleId") REFERENCES "schedules"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "games" ADD CONSTRAINT "FK_games_slotAFromGameId" FOREIGN KEY ("slotAFromGameId") REFERENCES "games"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "games" ADD CONSTRAINT "FK_games_slotBFromGameId" FOREIGN KEY ("slotBFromGameId") REFERENCES "games"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    await queryRunner.query(`CREATE TYPE "public"."matches_competitorkind_enum" AS ENUM('registration', 'team')`);
    await queryRunner.query(
      `CREATE TABLE "matches" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "gameId" uuid NOT NULL, "competitorKind" "public"."matches_competitorkind_enum" NOT NULL, "competitorAId" uuid, "competitorBId" uuid, "winnerId" uuid, "startTime" TIMESTAMP, "endTime" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_matches_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "matches" ADD CONSTRAINT "FK_matches_gameId" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE TABLE "scores" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "matchId" uuid NOT NULL, "userId" uuid NOT NULL, "competitorId" uuid NOT NULL, "points" integer NOT NULL, "penalties" integer NOT NULL DEFAULT '0', "kataName" character varying(255), "flags" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_scores_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "scores" ADD CONSTRAINT "FK_scores_matchId" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "scores" ADD CONSTRAINT "FK_scores_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "scores" DROP CONSTRAINT "FK_scores_userId"`);
    await queryRunner.query(`ALTER TABLE "scores" DROP CONSTRAINT "FK_scores_matchId"`);
    await queryRunner.query(`DROP TABLE "scores"`);
    await queryRunner.query(`ALTER TABLE "matches" DROP CONSTRAINT "FK_matches_gameId"`);
    await queryRunner.query(`DROP TABLE "matches"`);
    await queryRunner.query(`DROP TYPE "public"."matches_competitorkind_enum"`);
    await queryRunner.query(`ALTER TABLE "games" DROP CONSTRAINT "FK_games_slotBFromGameId"`);
    await queryRunner.query(`ALTER TABLE "games" DROP CONSTRAINT "FK_games_slotAFromGameId"`);
    await queryRunner.query(`ALTER TABLE "games" DROP CONSTRAINT "FK_games_scheduleId"`);
    await queryRunner.query(`DROP TABLE "games"`);
    await queryRunner.query(`DROP TYPE "public"."games_winnerside_enum"`);
    await queryRunner.query(`DROP TYPE "public"."games_slotoutcome_enum"`);
    await queryRunner.query(`DROP TYPE "public"."games_slotkind_enum"`);
    await queryRunner.query(`ALTER TABLE "schedules" DROP CONSTRAINT "FK_schedules_categoryId"`);
    await queryRunner.query(`ALTER TABLE "schedules" DROP CONSTRAINT "FK_schedules_tournamentId"`);
    await queryRunner.query(`DROP TABLE "schedules"`);
    await queryRunner.query(`DROP TYPE "public"."schedules_kind_enum"`);

    await queryRunner.query(
      `CREATE TABLE "brackets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "categoryId" uuid NOT NULL, "registrationId" uuid, "round" integer NOT NULL, "position" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_557930575b564b859ce0f0c99c5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "matches" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "bracketId" uuid NOT NULL, "competitorAId" uuid, "competitorBId" uuid, "winnerId" uuid, "startTime" TIMESTAMP, "endTime" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_8a22c7b2e0828988d51256117f4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "scores" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "matchId" uuid NOT NULL, "userId" uuid NOT NULL, "competitorId" uuid NOT NULL, "points" integer NOT NULL, "penalties" integer NOT NULL DEFAULT '0', "kataName" character varying(255), "flags" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c36917e6f26293b91d04b8fd521" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "brackets" ADD CONSTRAINT "FK_b413fa1a287918cf558262d9dc7" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "brackets" ADD CONSTRAINT "FK_8bbbe0461bbd16b3de6e7979640" FOREIGN KEY ("registrationId") REFERENCES "registrations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "matches" ADD CONSTRAINT "FK_d843865ffa37082458705576aeb" FOREIGN KEY ("bracketId") REFERENCES "brackets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "matches" ADD CONSTRAINT "FK_e04a857e18cf03d40c53973a67f" FOREIGN KEY ("competitorAId") REFERENCES "registrations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "matches" ADD CONSTRAINT "FK_6db659634158a7be6ff856fa6fc" FOREIGN KEY ("competitorBId") REFERENCES "registrations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "matches" ADD CONSTRAINT "FK_eb5e9984be5b3bd5c8e3ef2d9ec" FOREIGN KEY ("winnerId") REFERENCES "registrations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "scores" ADD CONSTRAINT "FK_9012285dd168d361368836fa967" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "scores" ADD CONSTRAINT "FK_c0508b319d67f890b4118099680" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "scores" ADD CONSTRAINT "FK_f83bc655e50581e73b992c7668c" FOREIGN KEY ("competitorId") REFERENCES "registrations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
