import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class Migration1770061231785 implements MigrationInterface {
  name = 'Migration1770061231785';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "public"."users_roles_enum" RENAME TO "users_roles_enum_old"`);
    await queryRunner.query(
      `CREATE TYPE "public"."users_roles_enum" AS ENUM('admin', 'club_owner', 'club_member', 'club_coach', 'free_member', 'judge')`,
    );
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "roles" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "roles" TYPE "public"."users_roles_enum"[] USING ARRAY['admin']::"public"."users_roles_enum"[]`,
    );
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "roles" SET DEFAULT '{}'`);
    await queryRunner.query(`DROP TYPE "public"."users_roles_enum_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."users_roles_enum_old" AS ENUM('admin', 'organizer', 'coach', 'competitor', 'judge', 'staff')`,
    );
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "roles" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "roles" TYPE "public"."users_roles_enum_old"[] USING "roles"::"text"::"public"."users_roles_enum_old"[]`,
    );
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "roles" SET DEFAULT '{}'`);
    await queryRunner.query(`DROP TYPE "public"."users_roles_enum"`);
    await queryRunner.query(`ALTER TYPE "public"."users_roles_enum_old" RENAME TO "users_roles_enum"`);
  }
}
