import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';

import { Bracket } from '../bracket/bracket.entity';
import { Registration } from '../registration/registration.entity';
import { Score } from '../score/score.entity';

/**
 * Match Entity
 * Single match between two competitors.
 */
@Entity('matches')
export class Match {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  bracketId!: string;

  @Column({ type: 'uuid', nullable: true })
  competitorAId!: string | null; // nullable for byes

  @Column({ type: 'uuid', nullable: true })
  competitorBId!: string | null; // nullable for byes

  @Column({ type: 'uuid', nullable: true })
  winnerId!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  startTime!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  endTime!: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Bracket, (bracket) => bracket.matches)
  @JoinColumn({ name: 'bracketId' })
  bracket!: Bracket;

  @ManyToOne(() => Registration, { nullable: true })
  @JoinColumn({ name: 'competitorAId' })
  competitorA!: Registration | null;

  @ManyToOne(() => Registration, { nullable: true })
  @JoinColumn({ name: 'competitorBId' })
  competitorB!: Registration | null;

  @ManyToOne(() => Registration, { nullable: true })
  @JoinColumn({ name: 'winnerId' })
  winner!: Registration | null;

  @OneToMany(() => Score, (score) => score.match)
  scores!: Score[];
}

