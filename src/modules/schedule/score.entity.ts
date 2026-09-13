import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from '../user/user.entity';

import { Match } from './match.entity';

@Entity('scores')
export class Score {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  matchId!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'uuid' })
  competitorId!: string;

  @Column({ type: 'int' })
  points!: number;

  @Column({ type: 'int', default: 0 })
  penalties!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  kataName!: string | null;

  @Column({ type: 'int', nullable: true })
  flags!: number | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;

  @ManyToOne(() => Match, (match) => match.scores, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'matchId' })
  match!: Match;

  @ManyToOne(() => User, (user) => user.scores)
  @JoinColumn({ name: 'userId' })
  user!: User;
}
