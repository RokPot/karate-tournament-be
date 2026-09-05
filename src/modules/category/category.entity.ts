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

import { BeltLevel, CategoryGender, Discipline, SubDiscipline } from '~common/enums';

import { numericTransformer } from '~database/transformers/numeric.transformer';

import { Bracket } from '../bracket/bracket.entity';
import { Club } from '../club/club.entity';
import { Registration } from '../registration/registration.entity';
import { TournamentCategory } from '../tournament/tournament-category.entity';

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

  @Column({ type: 'enum', enum: SubDiscipline, nullable: true })
  subDiscipline!: SubDiscipline | null;

  @Column({ type: 'enum', enum: CategoryGender, nullable: true })
  gender!: CategoryGender | null;

  @Column({ type: 'int', nullable: true })
  ageMin!: number | null;

  @Column({ type: 'int', nullable: true })
  ageMax!: number | null;

  @Column({
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
    transformer: numericTransformer,
  })
  weightMin!: number | null;

  @Column({
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
    transformer: numericTransformer,
  })
  weightMax!: number | null;

  @Column({ type: 'enum', enum: BeltLevel, nullable: true })
  beltMin!: BeltLevel | null;

  @Column({ type: 'enum', enum: BeltLevel, nullable: true })
  beltMax!: BeltLevel | null;

  @Column({ type: 'int', nullable: true })
  teamSize!: number | null;

  @Column({ type: 'int', nullable: true })
  teamReservesSize!: number | null;

  @Column({ type: 'uuid', nullable: true })
  clubId!: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Club, { nullable: true })
  @JoinColumn({ name: 'clubId' })
  club!: Club | null;

  @OneToMany(() => TournamentCategory, (tournamentAssignment) => tournamentAssignment.category)
  tournamentAssignments!: TournamentCategory[];

  @OneToMany(() => Registration, (registration) => registration.category)
  registrations!: Registration[];

  @OneToMany(() => Bracket, (bracket) => bracket.category)
  brackets!: Bracket[];
}
