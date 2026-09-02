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

  @OneToMany(() => TournamentCategory, (categoryAssignment) => categoryAssignment.tournament)
  categoryAssignments!: TournamentCategory[];

  @OneToMany(() => Registration, (registration) => registration.tournament)
  registrations!: Registration[];
}
