import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1764941169925 implements MigrationInterface {
    name = 'InitialSchema1764941169925'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "scores" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "matchId" uuid NOT NULL, "userId" uuid NOT NULL, "competitorId" uuid NOT NULL, "points" integer NOT NULL, "penalties" integer NOT NULL DEFAULT '0', "kataName" character varying(255), "flags" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c36917e6f26293b91d04b8fd521" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "matches" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "bracketId" uuid NOT NULL, "competitorAId" uuid, "competitorBId" uuid, "winnerId" uuid, "startTime" TIMESTAMP, "endTime" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_8a22c7b2e0828988d51256117f4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "brackets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "categoryId" uuid NOT NULL, "registrationId" uuid, "round" integer NOT NULL, "position" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_557930575b564b859ce0f0c99c5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."categories_discipline_enum" AS ENUM('kata', 'kumite')`);
        await queryRunner.query(`CREATE TYPE "public"."categories_gender_enum" AS ENUM('male', 'female', 'mixed')`);
        await queryRunner.query(`CREATE TYPE "public"."categories_beltmin_enum" AS ENUM('white', 'yellow', 'orange', 'green', 'blue', 'brown', 'black', 'black_dan_1', 'black_dan_2', 'black_dan_3', 'black_dan_4', 'black_dan_5', 'black_dan_6', 'black_dan_7', 'black_dan_8', 'black_dan_9', 'black_dan_10')`);
        await queryRunner.query(`CREATE TYPE "public"."categories_beltmax_enum" AS ENUM('white', 'yellow', 'orange', 'green', 'blue', 'brown', 'black', 'black_dan_1', 'black_dan_2', 'black_dan_3', 'black_dan_4', 'black_dan_5', 'black_dan_6', 'black_dan_7', 'black_dan_8', 'black_dan_9', 'black_dan_10')`);
        await queryRunner.query(`CREATE TABLE "categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tournamentId" uuid NOT NULL, "name" character varying(255) NOT NULL, "discipline" "public"."categories_discipline_enum" NOT NULL, "gender" "public"."categories_gender_enum" NOT NULL, "ageMin" integer NOT NULL, "ageMax" integer NOT NULL, "weightMin" numeric(5,2), "weightMax" numeric(5,2), "beltMin" "public"."categories_beltmin_enum" NOT NULL, "beltMax" "public"."categories_beltmax_enum" NOT NULL, "tatami" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "tournaments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "location" character varying(255) NOT NULL, "date" date NOT NULL, "startTime" TIME NOT NULL, "registrationDeadline" TIMESTAMP NOT NULL, "createdBy" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6d5d129da7a80cf99e8ad4833a9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."registrations_status_enum" AS ENUM('pending', 'approved', 'rejected')`);
        await queryRunner.query(`CREATE TABLE "registrations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "clubId" uuid NOT NULL, "tournamentId" uuid NOT NULL, "categoryId" uuid NOT NULL, "status" "public"."registrations_status_enum" NOT NULL DEFAULT 'pending', "finalWeight" numeric(5,2), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6013e724d7b22929da9cd7282d1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "clubs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "address" character varying(500), "country" character varying(100), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_bb09bd0c8d5238aeaa8f86ee0d4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "action" character varying(100) NOT NULL, "entity" character varying(100) NOT NULL, "entityId" uuid NOT NULL, "timestamp" TIMESTAMP NOT NULL DEFAULT now(), "metadata" jsonb, CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_88dcc148d532384790ab874c3d" ON "audit_logs" ("timestamp") `);
        await queryRunner.query(`CREATE INDEX "IDX_cfa83f61e4d27a87fcae1e025a" ON "audit_logs" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_2643f2a68c662985433dbddca1" ON "audit_logs" ("entity", "entityId") `);
        await queryRunner.query(`CREATE TYPE "public"."users_gender_enum" AS ENUM('male', 'female', 'other')`);
        await queryRunner.query(`CREATE TYPE "public"."users_beltlevel_enum" AS ENUM('white', 'yellow', 'orange', 'green', 'blue', 'brown', 'black', 'black_dan_1', 'black_dan_2', 'black_dan_3', 'black_dan_4', 'black_dan_5', 'black_dan_6', 'black_dan_7', 'black_dan_8', 'black_dan_9', 'black_dan_10')`);
        await queryRunner.query(`CREATE TYPE "public"."users_roles_enum" AS ENUM('organizer', 'coach', 'competitor', 'judge', 'staff')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "auth0Id" character varying(255) NOT NULL, "clubId" uuid, "firstName" character varying(100), "lastName" character varying(100), "gender" "public"."users_gender_enum", "birthDate" date, "weight" numeric(5,2), "beltLevel" "public"."users_beltlevel_enum", "roles" "public"."users_roles_enum" array NOT NULL DEFAULT '{}', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_d7925ac1be04ad9d0f11c14d707" UNIQUE ("auth0Id"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_d7925ac1be04ad9d0f11c14d70" ON "users" ("auth0Id") `);
        await queryRunner.query(`ALTER TABLE "scores" ADD CONSTRAINT "FK_9012285dd168d361368836fa967" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "scores" ADD CONSTRAINT "FK_c0508b319d67f890b4118099680" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "scores" ADD CONSTRAINT "FK_f83bc655e50581e73b992c7668c" FOREIGN KEY ("competitorId") REFERENCES "registrations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "matches" ADD CONSTRAINT "FK_d843865ffa37082458705576aeb" FOREIGN KEY ("bracketId") REFERENCES "brackets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "matches" ADD CONSTRAINT "FK_e04a857e18cf03d40c53973a67f" FOREIGN KEY ("competitorAId") REFERENCES "registrations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "matches" ADD CONSTRAINT "FK_6db659634158a7be6ff856fa6fc" FOREIGN KEY ("competitorBId") REFERENCES "registrations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "matches" ADD CONSTRAINT "FK_eb5e9984be5b3bd5c8e3ef2d9ec" FOREIGN KEY ("winnerId") REFERENCES "registrations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "brackets" ADD CONSTRAINT "FK_b413fa1a287918cf558262d9dc7" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "brackets" ADD CONSTRAINT "FK_8bbbe0461bbd16b3de6e7979640" FOREIGN KEY ("registrationId") REFERENCES "registrations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "categories" ADD CONSTRAINT "FK_ac016770cbcc3750278d97ccd0a" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tournaments" ADD CONSTRAINT "FK_b91665cf60d14f75f5d4b3a223d" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "registrations" ADD CONSTRAINT "FK_7e5ae7aa55bb98b8b9dcbe32ca3" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "registrations" ADD CONSTRAINT "FK_e785c9d2415d8ca3ff483bc507c" FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "registrations" ADD CONSTRAINT "FK_cda8974216e531da0fb7586b19b" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "registrations" ADD CONSTRAINT "FK_e63ca6871925f778d5e1acb94cf" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_cfa83f61e4d27a87fcae1e025ab" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_7c847424bb951725774214c5ac6" FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_7c847424bb951725774214c5ac6"`);
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_cfa83f61e4d27a87fcae1e025ab"`);
        await queryRunner.query(`ALTER TABLE "registrations" DROP CONSTRAINT "FK_e63ca6871925f778d5e1acb94cf"`);
        await queryRunner.query(`ALTER TABLE "registrations" DROP CONSTRAINT "FK_cda8974216e531da0fb7586b19b"`);
        await queryRunner.query(`ALTER TABLE "registrations" DROP CONSTRAINT "FK_e785c9d2415d8ca3ff483bc507c"`);
        await queryRunner.query(`ALTER TABLE "registrations" DROP CONSTRAINT "FK_7e5ae7aa55bb98b8b9dcbe32ca3"`);
        await queryRunner.query(`ALTER TABLE "tournaments" DROP CONSTRAINT "FK_b91665cf60d14f75f5d4b3a223d"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT "FK_ac016770cbcc3750278d97ccd0a"`);
        await queryRunner.query(`ALTER TABLE "brackets" DROP CONSTRAINT "FK_8bbbe0461bbd16b3de6e7979640"`);
        await queryRunner.query(`ALTER TABLE "brackets" DROP CONSTRAINT "FK_b413fa1a287918cf558262d9dc7"`);
        await queryRunner.query(`ALTER TABLE "matches" DROP CONSTRAINT "FK_eb5e9984be5b3bd5c8e3ef2d9ec"`);
        await queryRunner.query(`ALTER TABLE "matches" DROP CONSTRAINT "FK_6db659634158a7be6ff856fa6fc"`);
        await queryRunner.query(`ALTER TABLE "matches" DROP CONSTRAINT "FK_e04a857e18cf03d40c53973a67f"`);
        await queryRunner.query(`ALTER TABLE "matches" DROP CONSTRAINT "FK_d843865ffa37082458705576aeb"`);
        await queryRunner.query(`ALTER TABLE "scores" DROP CONSTRAINT "FK_f83bc655e50581e73b992c7668c"`);
        await queryRunner.query(`ALTER TABLE "scores" DROP CONSTRAINT "FK_c0508b319d67f890b4118099680"`);
        await queryRunner.query(`ALTER TABLE "scores" DROP CONSTRAINT "FK_9012285dd168d361368836fa967"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d7925ac1be04ad9d0f11c14d70"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_roles_enum"`);
        await queryRunner.query(`DROP TYPE "public"."users_beltlevel_enum"`);
        await queryRunner.query(`DROP TYPE "public"."users_gender_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2643f2a68c662985433dbddca1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cfa83f61e4d27a87fcae1e025a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_88dcc148d532384790ab874c3d"`);
        await queryRunner.query(`DROP TABLE "audit_logs"`);
        await queryRunner.query(`DROP TABLE "clubs"`);
        await queryRunner.query(`DROP TABLE "registrations"`);
        await queryRunner.query(`DROP TYPE "public"."registrations_status_enum"`);
        await queryRunner.query(`DROP TABLE "tournaments"`);
        await queryRunner.query(`DROP TABLE "categories"`);
        await queryRunner.query(`DROP TYPE "public"."categories_beltmax_enum"`);
        await queryRunner.query(`DROP TYPE "public"."categories_beltmin_enum"`);
        await queryRunner.query(`DROP TYPE "public"."categories_gender_enum"`);
        await queryRunner.query(`DROP TYPE "public"."categories_discipline_enum"`);
        await queryRunner.query(`DROP TABLE "brackets"`);
        await queryRunner.query(`DROP TABLE "matches"`);
        await queryRunner.query(`DROP TABLE "scores"`);
    }

}
