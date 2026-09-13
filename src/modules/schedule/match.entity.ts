import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { CompetitorKind } from '~common/enums';

import { Game } from './game.entity';
import { Score } from './score.entity';

@Entity('matches')
export class Match {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  gameId!: string;

  @Column({ type: 'enum', enum: CompetitorKind })
  competitorKind!: CompetitorKind;

  @Column({ type: 'uuid', nullable: true })
  competitorAId!: string | null;

  @Column({ type: 'uuid', nullable: true })
  competitorBId!: string | null;

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

  @ManyToOne(() => Game, (game) => game.matches, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'gameId' })
  game!: Game;

  @OneToMany(() => Score, (score) => score.match)
  scores!: Score[];
}
