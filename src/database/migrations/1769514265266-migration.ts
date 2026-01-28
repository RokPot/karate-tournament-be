import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1769514265266 implements MigrationInterface {
    name = 'Migration1769514265266'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tournaments" RENAME COLUMN "startTime" TO "startDate"`);
        await queryRunner.query(`ALTER TABLE "tournaments" DROP COLUMN "startDate"`);
        await queryRunner.query(`ALTER TABLE "tournaments" ADD "startDate" TIMESTAMP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tournaments" DROP COLUMN "startDate"`);
        await queryRunner.query(`ALTER TABLE "tournaments" ADD "startDate" TIME NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tournaments" RENAME COLUMN "startDate" TO "startTime"`);
    }

}
