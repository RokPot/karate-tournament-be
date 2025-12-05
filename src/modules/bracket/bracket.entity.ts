import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';

import { Category } from '../category/category.entity';
import { Registration } from '../registration/registration.entity';
import { Match } from '../match/match.entity';

/**
 * Bracket Entity
 * Tournament bracket (single elimination).
 */
@Entity('brackets')
export class Bracket {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  categoryId!: string;

  @Column({ type: 'uuid', nullable: true })
  registrationId!: string | null;

  @Column({ type: 'int' })
  round!: number; // 1 is first round, goes up toward final

  @Column({ type: 'int' })
  position!: number; // bracket slot

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Category, (category) => category.brackets)
  @JoinColumn({ name: 'categoryId' })
  category!: Category;

  @ManyToOne(() => Registration, { nullable: true })
  @JoinColumn({ name: 'registrationId' })
  registration!: Registration | null;

  @OneToMany(() => Match, (match) => match.bracket)
  matches!: Match[];
}

