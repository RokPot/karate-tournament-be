import { type MigrationInterface, type QueryRunner } from 'typeorm';

import { deleteAllGlobalCategories, insertGlobalCategories } from '../seeds/global-categories';

export class ReplaceGlobalCategories1770410000000 implements MigrationInterface {
  name = 'ReplaceGlobalCategories1770410000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await deleteAllGlobalCategories(queryRunner);
    await insertGlobalCategories(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await deleteAllGlobalCategories(queryRunner);
  }
}
