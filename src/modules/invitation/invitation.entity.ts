import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

import { InvitationStatus } from '~common/enums';

import { Club } from '../club/club.entity';
import { User } from '../user/user.entity';

/**
 * Invitation Entity
 * Represents a club owner invitation. Created when a club is created with owner email.
 * User accepts via token to link their account to the club with owner role.
 */
@Entity('invitations')
export class Invitation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  clubId!: string;

  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  firstName!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  lastName!: string | null;

  @Column({ type: 'varchar', length: 255, unique: true })
  @Index('IDX_invitations_token', { unique: true })
  token!: string;

  @Column({ type: 'timestamp' })
  expiresAt!: Date;

  @Column({ type: 'enum', enum: InvitationStatus, default: InvitationStatus.PENDING })
  status!: InvitationStatus;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  acceptedAt!: Date | null;

  @Column({ type: 'uuid', nullable: true })
  acceptedByUserId!: string | null;

  // Relations
  @ManyToOne(() => Club, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clubId' })
  club!: Club;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'acceptedByUserId' })
  acceptedByUser!: User | null;
}
