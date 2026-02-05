import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

import { Registration } from '../registration/registration.entity';
import type { Tournament } from '../tournament/tournament.entity';
import { User } from '../user/user.entity';

/**
 * Club Entity
 * Represents a karate club that owns members, coaches, and staff.
 */
@Entity('clubs')
export class Club {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  address!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country!: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;

  // Relations
  @OneToMany(() => User, (user) => user.club)
  users!: User[];

  // todo rokpot, is this relation here needed?
  @OneToMany(() => Registration, (registration) => registration.club)
  registrations!: Registration[];

  @OneToMany('Tournament', (tournament: any) => tournament.club)
  tournaments!: Tournament[];

  /** Set by loadRelationCountAndMap when loading list; not a DB column. */
  membersCount?: number;
}
