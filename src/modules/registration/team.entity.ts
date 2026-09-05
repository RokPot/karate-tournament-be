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

import { Category } from '../category/category.entity';
import { Club } from '../club/club.entity';
import { Tournament } from '../tournament/tournament.entity';

import { Registration } from './registration.entity';

/**
 * A team roster in a tournament category (kata-team / kumite-team).
 */
@Entity('teams')
export class Team {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  tournamentId!: string;

  @Column({ type: 'uuid' })
  categoryId!: string;

  @Column({ type: 'uuid', nullable: true })
  clubId!: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;

  @ManyToOne(() => Tournament)
  @JoinColumn({ name: 'tournamentId' })
  tournament!: Tournament;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'categoryId' })
  category!: Category;

  @ManyToOne(() => Club, { nullable: true })
  @JoinColumn({ name: 'clubId' })
  club!: Club | null;

  @OneToMany(() => Registration, (registration) => registration.team)
  registrations!: Registration[];
}
