import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1769978023905 implements MigrationInterface {
    name = 'Migration1769978023905'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."invitations_status_enum" AS ENUM('pending', 'accepted', 'expired', 'cancelled')`);
        await queryRunner.query(`CREATE TABLE "invitations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "clubId" uuid NOT NULL, "email" character varying(255) NOT NULL, "firstName" character varying(100), "lastName" character varying(100), "token" character varying(255) NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "status" "public"."invitations_status_enum" NOT NULL DEFAULT 'pending', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "acceptedAt" TIMESTAMP, "acceptedByUserId" uuid, CONSTRAINT "UQ_e577dcf9bb6d084373ed3998509" UNIQUE ("token"), CONSTRAINT "PK_5dec98cfdfd562e4ad3648bbb07" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_invitations_token" ON "invitations" ("token") `);
        await queryRunner.query(`ALTER TABLE "invitations" ADD CONSTRAINT "FK_e15433091451c9a1ee2cf11e945" FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invitations" ADD CONSTRAINT "FK_3722ea7511a7ce9235525c1daa3" FOREIGN KEY ("acceptedByUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "invitations" DROP CONSTRAINT "FK_3722ea7511a7ce9235525c1daa3"`);
        await queryRunner.query(`ALTER TABLE "invitations" DROP CONSTRAINT "FK_e15433091451c9a1ee2cf11e945"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_invitations_token"`);
        await queryRunner.query(`DROP TABLE "invitations"`);
        await queryRunner.query(`DROP TYPE "public"."invitations_status_enum"`);
    }

}
