import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
} from 'typeorm';

import { User } from '../user/user.entity';
import { Club } from '../club/club.entity';
import { Tournament } from '../tournament/tournament.entity';
import { Category } from '../category/category.entity';
import { Bracket } from '../bracket/bracket.entity';
import { RegistrationStatus } from '~common/enums';

/**
 * Registration Entity
 * A user registered into a category for a specific tournament.
 */
@Entity('registrations')
export class Registration {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'uuid' })
  clubId!: string;

  @Column({ type: 'uuid' })
  tournamentId!: string;

  @Column({ type: 'uuid' })
  categoryId!: string;

  @Column({ type: 'enum', enum: RegistrationStatus, default: RegistrationStatus.PENDING })
  status!: RegistrationStatus;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  finalWeight!: number | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.registrations)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ManyToOne(() => Club, (club) => club.registrations)
  @JoinColumn({ name: 'clubId' })
  club!: Club;

  @ManyToOne(() => Tournament, (tournament) => tournament.registrations)
  @JoinColumn({ name: 'tournamentId' })
  tournament!: Tournament;

  @ManyToOne(() => Category, (category) => category.registrations)
  @JoinColumn({ name: 'categoryId' })
  category!: Category;

  @OneToOne(() => Bracket, (bracket) => bracket.registration, { nullable: true })
  bracket!: Bracket | null;
}

