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

import { TournamentStatus } from '~common/enums';

import { Club } from '../club/club.entity';
import { Registration } from '../registration/registration.entity';
import { User } from '../user/user.entity';

import { TournamentCategory } from './tournament-category.entity';

/**
 * Tournament Entity
 * Karate tournament created by organizers.
 */
@Entity('tournaments')
export class Tournament {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255 })
  location!: string;

  @Column({ type: 'timestamp' })
  startDate!: Date;

  @Column({ type: 'timestamp' })
  registrationDeadline!: Date;

  @Column({ type: 'uuid' })
  createdBy!: string;

  @Column({ type: 'uuid', nullable: true })
  clubId!: string | null;

  @Column({ type: 'enum', enum: TournamentStatus })
  status!: TournamentStatus;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt!: Date | null;

  @Column({ type: 'uuid', nullable: true })
  reviewedBy!: string | null;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  reviewNote!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  startedAt!: Date | null;

  @Column({ type: 'uuid', nullable: true })
  startedBy!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  endedAt!: Date | null;

  @Column({ type: 'uuid', nullable: true })
  endedBy!: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  createdByUser!: User;

  @ManyToOne(() => Club, (club) => club.tournaments, { nullable: true })
  @JoinColumn({ name: 'clubId' })
  club!: Club | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'reviewedBy' })
  reviewedByUser!: User | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'startedBy' })
  startedByUser!: User | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'endedBy' })
  endedByUser!: User | null;

  @OneToMany(() => TournamentCategory, (categoryAssignment) => categoryAssignment.tournament)
  categoryAssignments!: TournamentCategory[];

  @OneToMany(() => Registration, (registration) => registration.tournament)
  registrations!: Registration[];
}
