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

import { Discipline, CategoryGender, BeltLevel } from '~common/enums';

import { Tournament } from '../tournament/tournament.entity';
import { Registration } from '../registration/registration.entity';
import { Bracket } from '../bracket/bracket.entity';

/**
 * Category Entity
 * Defines division by age, weight, gender, belt, discipline.
 */
@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  tournamentId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'enum', enum: Discipline })
  discipline!: Discipline;

  @Column({ type: 'enum', enum: CategoryGender })
  gender!: CategoryGender;

  @Column({ type: 'int' })
  ageMin!: number;

  @Column({ type: 'int' })
  ageMax!: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  weightMin!: number | null;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  weightMax!: number | null;

  @Column({ type: 'enum', enum: BeltLevel })
  beltMin!: BeltLevel;

  @Column({ type: 'enum', enum: BeltLevel })
  beltMax!: BeltLevel;

  @Column({ type: 'int', nullable: true })
  tatami!: number | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Tournament, (tournament) => tournament.categories)
  @JoinColumn({ name: 'tournamentId' })
  tournament!: Tournament;

  @OneToMany(() => Registration, (registration) => registration.category)
  registrations!: Registration[];

  @OneToMany(() => Bracket, (bracket) => bracket.category)
  brackets!: Bracket[];
}

