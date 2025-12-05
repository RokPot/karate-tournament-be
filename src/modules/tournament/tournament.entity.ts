import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';

import { User } from '../user/user.entity';
import { Category } from '../category/category.entity';
import { Registration } from '../registration/registration.entity';

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

  @Column({ type: 'date' })
  date!: Date;

  @Column({ type: 'time' })
  startTime!: string;

  @Column({ type: 'timestamp' })
  registrationDeadline!: Date;

  @Column({ type: 'uuid' })
  createdBy!: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  createdByUser!: User;

  @OneToMany(() => Category, (category) => category.tournament)
  categories!: Category[];

  @OneToMany(() => Registration, (registration) => registration.tournament)
  registrations!: Registration[];
}

