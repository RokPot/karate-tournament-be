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

import { GameSlotKind, GameSlotOutcome, GameWinnerSide } from '~common/enums';

import { Match } from './match.entity';
import { Schedule } from './schedule.entity';

@Entity('games')
@Index(['scheduleId', 'key'], { unique: true })
export class Game {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  scheduleId!: string;

  @Column({ type: 'varchar', length: 64 })
  key!: string;

  @Column({ type: 'boolean', default: false })
  isThirdPlace!: boolean;

  @Column({ type: 'boolean', default: false })
  isBye!: boolean;

  @Column({ type: 'enum', enum: GameWinnerSide, nullable: true })
  winnerSide!: GameWinnerSide | null;

  @Column({ type: 'enum', enum: GameSlotKind })
  slotAKind!: GameSlotKind;

  @Column({ type: 'enum', enum: GameSlotKind })
  slotBKind!: GameSlotKind;

  @Column({ type: 'uuid', nullable: true })
  slotACompetitorId!: string | null;

  @Column({ type: 'uuid', nullable: true })
  slotBCompetitorId!: string | null;

  @Column({ type: 'uuid', nullable: true })
  slotAFromGameId!: string | null;

  @Column({ type: 'uuid', nullable: true })
  slotBFromGameId!: string | null;

  @Column({ type: 'enum', enum: GameSlotOutcome, nullable: true })
  slotAOutcome!: GameSlotOutcome | null;

  @Column({ type: 'enum', enum: GameSlotOutcome, nullable: true })
  slotBOutcome!: GameSlotOutcome | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;

  @ManyToOne(() => Schedule, (schedule) => schedule.games, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'scheduleId' })
  schedule!: Schedule;

  @ManyToOne(() => Game, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'slotAFromGameId' })
  slotAFromGame!: Game | null;

  @ManyToOne(() => Game, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'slotBFromGameId' })
  slotBFromGame!: Game | null;

  @OneToMany(() => Match, (match) => match.game)
  matches!: Match[];
}
