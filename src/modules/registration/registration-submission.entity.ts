import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';

import { Club } from '../club/club.entity';
import { Tournament } from '../tournament/tournament.entity';
import { User } from '../user/user.entity';

import { Registration } from './registration.entity';

/**
 * One public registration submit (Club and contact form + participants).
 */
@Entity('registration_submissions')
@Index(['tournamentId'])
export class RegistrationSubmission {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  tournamentId!: string;

  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 100 })
  firstName!: string;

  @Column({ type: 'varchar', length: 100 })
  lastName!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  clubName!: string | null;

  @Column({ type: 'uuid', nullable: true })
  clubId!: string | null;

  @Column({ type: 'uuid', nullable: true })
  registeredByUserId!: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @ManyToOne(() => Tournament, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tournamentId' })
  tournament!: Tournament;

  @ManyToOne(() => Club, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'clubId' })
  club!: Club | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'registeredByUserId' })
  registeredByUser!: User | null;

  @OneToMany(() => Registration, (registration) => registration.submission)
  registrations!: Registration[];
}
