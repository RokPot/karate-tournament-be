import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1769601978291 implements MigrationInterface {
    name = 'Migration1769601978291'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tournaments" DROP COLUMN "date"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tournaments" ADD "date" date NOT NULL`);
    }

}
