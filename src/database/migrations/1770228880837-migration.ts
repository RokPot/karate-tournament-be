import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1770228880837 implements MigrationInterface {
    name = 'Migration1770228880837'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "email" character varying(255)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email"`);
    }

}
