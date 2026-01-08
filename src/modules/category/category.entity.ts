import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  OneToMany,
} from 'typeorm';

import { Discipline, CategoryGender, BeltLevel } from '~common/enums';

import { Bracket } from '../bracket/bracket.entity';
import { Registration } from '../registration/registration.entity';
import { Tournament } from '../tournament/tournament.entity';

/**
 * Category Entity
 * Defines division by age, weight, gender, belt, discipline.
 */
@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'enum', enum: Discipline })
  discipline!: Discipline;

  @Column({ type: 'enum', enum: CategoryGender, array: true, default: [] })
  gender!: CategoryGender[];

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

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;

  // Relations
  @ManyToMany(() => Tournament, (tournament) => tournament.categories)
  tournaments!: Tournament[];

  @OneToMany(() => Registration, (registration) => registration.category)
  registrations!: Registration[];

  @OneToMany(() => Bracket, (bracket) => bracket.category)
  brackets!: Bracket[];
}
