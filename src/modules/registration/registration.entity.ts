import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';

import { RegistrationStatus, TeamRole } from '~common/enums';

import { numericTransformer } from '~database/transformers/numeric.transformer';

import { Bracket } from '../bracket/bracket.entity';
import { Category } from '../category/category.entity';
import { Club } from '../club/club.entity';
import { Tournament } from '../tournament/tournament.entity';
import { User } from '../user/user.entity';

import { Team } from './team.entity';

/**
 * Registration Entity
 * A user registered into a category for a specific tournament.
 */
@Entity('registrations')
@Index(['userId', 'tournamentId', 'categoryId'], { unique: true })
export class Registration {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'uuid', nullable: true })
  clubId!: string | null;

  @Column({ type: 'uuid' })
  tournamentId!: string;

  @Column({ type: 'uuid' })
  categoryId!: string;

  @Column({ type: 'enum', enum: RegistrationStatus, default: RegistrationStatus.PENDING })
  status!: RegistrationStatus;

  @Column({
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
    transformer: numericTransformer,
  })
  finalWeight!: number | null;

  @Column({ type: 'uuid', nullable: true })
  teamId!: string | null;

  @Column({ type: 'enum', enum: TeamRole, nullable: true })
  teamRole!: TeamRole | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.registrations)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ManyToOne(() => Club, (club) => club.registrations, { nullable: true })
  @JoinColumn({ name: 'clubId' })
  club!: Club | null;

  @ManyToOne(() => Tournament, (tournament) => tournament.registrations)
  @JoinColumn({ name: 'tournamentId' })
  tournament!: Tournament;

  @ManyToOne(() => Category, (category) => category.registrations)
  @JoinColumn({ name: 'categoryId' })
  category!: Category;

  @ManyToOne(() => Team, (team) => team.registrations, { nullable: true })
  @JoinColumn({ name: 'teamId' })
  team!: Team | null;

  @OneToOne(() => Bracket, (bracket) => bracket.registration, { nullable: true })
  bracket!: Bracket | null;
}
