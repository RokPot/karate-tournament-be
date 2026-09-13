import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { ScheduleKind } from '~common/enums';

import { Category } from '../category/category.entity';
import { Tournament } from '../tournament/tournament.entity';

import { Game } from './game.entity';

@Entity('schedules')
@Index(['tournamentId', 'categoryId'], { unique: true })
export class Schedule {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  tournamentId!: string;

  @Column({ type: 'uuid' })
  categoryId!: string;

  @Column({ type: 'enum', enum: ScheduleKind })
  kind!: ScheduleKind;

  @Column({ type: 'int' })
  size!: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;

  @ManyToOne(() => Tournament, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tournamentId' })
  tournament!: Tournament;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'categoryId' })
  category!: Category;

  @OneToMany(() => Game, (game) => game.schedule)
  games!: Game[];
}
