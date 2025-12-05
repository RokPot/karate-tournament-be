import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { Match } from '../match/match.entity';
import { User } from '../user/user.entity';
import { Registration } from '../registration/registration.entity';

/**
 * Score Entity
 * Stores judge scoring or kumite points.
 */
@Entity('scores')
export class Score {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  matchId!: string;

  @Column({ type: 'uuid' })
  userId!: string; // judge or scorekeeper

  @Column({ type: 'uuid' })
  competitorId!: string;

  @Column({ type: 'int' })
  points!: number;

  @Column({ type: 'int', default: 0 })
  penalties!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  kataName!: string | null;

  @Column({ type: 'int', nullable: true })
  flags!: number | null; // for kata qualification rounds

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Match, (match) => match.scores)
  @JoinColumn({ name: 'matchId' })
  match!: Match;

  @ManyToOne(() => User, (user) => user.scores)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ManyToOne(() => Registration)
  @JoinColumn({ name: 'competitorId' })
  competitor!: Registration;
}

