import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1769891678172 implements MigrationInterface {
    name = 'Migration1769891678172'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tournaments" ADD "clubId" uuid`);
        await queryRunner.query(`ALTER TABLE "tournaments" ADD CONSTRAINT "FK_fb5af3083c89a38256aef475de7" FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tournaments" DROP CONSTRAINT "FK_fb5af3083c89a38256aef475de7"`);
        await queryRunner.query(`ALTER TABLE "tournaments" DROP COLUMN "clubId"`);
    }

}
