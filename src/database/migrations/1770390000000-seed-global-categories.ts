import { type MigrationInterface, type QueryRunner } from 'typeorm';

import { deleteSeededGlobalCategories, insertGlobalCategories } from '../seeds/global-categories';

export class SeedGlobalCategories1770390000000 implements MigrationInterface {
  name = 'SeedGlobalCategories1770390000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await insertGlobalCategories(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await deleteSeededGlobalCategories(queryRunner);
  }
}
