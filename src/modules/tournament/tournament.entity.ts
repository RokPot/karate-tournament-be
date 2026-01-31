import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  OneToMany,
  JoinColumn,
  JoinTable,
} from 'typeorm';

import { Category } from '../category/category.entity';
import { Club } from '../club/club.entity';
import { Registration } from '../registration/registration.entity';
import { User } from '../user/user.entity';

/**
 * Tournament Entity
 * Karate tournament created by organizers.
 */
@Entity('tournaments')
export class Tournament {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255 })
  location!: string;

  @Column({ type: 'timestamp' })
  startDate!: Date;

  @Column({ type: 'timestamp' })
  registrationDeadline!: Date;

  @Column({ type: 'uuid' })
  createdBy!: string;

  @Column({ type: 'uuid', nullable: true })
  clubId!: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  createdByUser!: User;

  @ManyToOne(() => Club, (club) => club.tournaments, { nullable: true })
  @JoinColumn({ name: 'clubId' })
  club!: Club | null;

  @ManyToMany(() => Category, (category) => category.tournaments)
  @JoinTable({
    name: 'tournament_categories',
    joinColumn: { name: 'tournamentId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'categoryId', referencedColumnName: 'id' },
  })
  categories!: Category[];

  @OneToMany(() => Registration, (registration) => registration.tournament)
  registrations!: Registration[];
}
