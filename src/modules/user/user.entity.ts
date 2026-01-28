import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';

import { Gender, BeltLevel, UserRole } from '~common/enums';

import { numericTransformer } from '~database/transformers/numeric.transformer';

import { AuditLog } from '../audit-log/audit-log.entity';
import { Club } from '../club/club.entity';
import { Registration } from '../registration/registration.entity';
import { Score } from '../score/score.entity';

/**
 * User Entity
 * Represents a person in a club. Can be competitor, coach, staff, organizer, judge, etc.
 * Linked to Auth0 user via auth0Id.
 */
@Entity('users')
@Index(['auth0Id'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  auth0Id!: string; // Maps to Auth0 user `sub`

  @Column({ type: 'uuid', nullable: true })
  clubId!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  firstName!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  lastName!: string | null;

  @Column({ type: 'enum', enum: Gender, nullable: true })
  gender!: Gender | null;

  @Column({ type: 'timestamp', nullable: true })
  birthDate!: Date | null;

  @Column({
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
    transformer: numericTransformer,
  })
  weight!: number | null;

  @Column({ type: 'enum', enum: BeltLevel, nullable: true })
  beltLevel!: BeltLevel | null;

  @Column({ type: 'enum', enum: UserRole, array: true, default: [] })
  roles!: UserRole[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Club, (club) => club.users, { nullable: true })
  @JoinColumn({ name: 'clubId' })
  club!: Club | null;

  @OneToMany(() => Registration, (registration) => registration.user)
  registrations!: Registration[];

  @OneToMany(() => Score, (score) => score.user)
  scores!: Score[];

  @OneToMany(() => AuditLog, (auditLog) => auditLog.user)
  auditLogs!: AuditLog[];
}
