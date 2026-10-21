import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { Category } from './category.entity';

/**
 * Other catalog categories whose eligible athletes may fill limited spots on a team category.
 */
@Entity('category_feeders')
export class CategoryFeeder {
  @PrimaryColumn({ type: 'uuid' })
  categoryId!: string;

  @PrimaryColumn({ type: 'uuid' })
  feederCategoryId!: string;

  @ManyToOne(() => Category, (category) => category.feeders, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'categoryId' })
  category!: Category;

  @ManyToOne(() => Category, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'feederCategoryId' })
  feederCategory!: Category;
}
