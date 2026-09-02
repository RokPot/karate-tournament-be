import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { Category } from '../category/category.entity';

import { Tournament } from './tournament.entity';

/**
 * Category assignment within a tournament, including tournament-specific ordering.
 */
@Entity('tournament_categories')
export class TournamentCategory {
  @PrimaryColumn({ type: 'uuid' })
  tournamentId!: string;

  @PrimaryColumn({ type: 'uuid' })
  categoryId!: string;

  @Column({ type: 'int' })
  sortOrder!: number;

  @ManyToOne(() => Tournament, (tournament) => tournament.categoryAssignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tournamentId' })
  tournament!: Tournament;

  @ManyToOne(() => Category, (category) => category.tournamentAssignments, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'categoryId' })
  category!: Category;
}
