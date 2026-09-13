import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { TeamRole } from '~common/enums';

import { Registration } from './registration.entity';
import { Team } from './team.entity';

/**
 * One person's place on a team roster.
 * The same registration (person in a category) can belong to multiple teams.
 */
@Entity('team_members')
@Index(['teamId', 'registrationId'], { unique: true })
export class TeamMember {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  teamId!: string;

  @Column({ type: 'uuid' })
  registrationId!: string;

  @Column({ type: 'enum', enum: TeamRole })
  role!: TeamRole;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;

  @ManyToOne(() => Team, (team) => team.members)
  @JoinColumn({ name: 'teamId' })
  team!: Team;

  @ManyToOne(() => Registration, (registration) => registration.teamMembers)
  @JoinColumn({ name: 'registrationId' })
  registration!: Registration;
}
