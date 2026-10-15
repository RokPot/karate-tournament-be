import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('registration_roster_otps')
@Index(['tournamentId', 'email'])
export class RegistrationRosterOtp {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  tournamentId!: string;

  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'uuid', nullable: true })
  clubId!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  clubName!: string | null;

  @Column({ type: 'varchar', length: 64 })
  codeHash!: string;

  @Column({ type: 'timestamp' })
  expiresAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  consumedAt!: Date | null;

  @Column({ type: 'int', default: 0 })
  attemptCount!: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;
}
