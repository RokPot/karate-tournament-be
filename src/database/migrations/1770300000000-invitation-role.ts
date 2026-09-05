import { type MigrationInterface, type QueryRunner } from 'typeorm';

export class InvitationRole1770300000000 implements MigrationInterface {
  name = 'InvitationRole1770300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "invitations" ADD "role" "public"."users_roles_enum" NOT NULL DEFAULT 'club_owner'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "invitations" DROP COLUMN "role"`);
  }
}
