import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('registration_roster_sessions')
export class RegistrationRosterSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 64, unique: true })
  @Index('IDX_registration_roster_sessions_tokenHash', { unique: true })
  tokenHash!: string;

  @Column({ type: 'uuid' })
  tournamentId!: string;

  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'uuid', nullable: true })
  clubId!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  clubName!: string | null;

  @Column({ type: 'timestamp' })
  expiresAt!: Date;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;
}
