import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserModule } from '../user/user.module';
import { User } from '../user/user.entity';
import { Tournament } from '../tournament/tournament.entity';
import { Category } from '../category/category.entity';
import { Club } from '../club/club.entity';
import { Registration } from './registration.entity';
import { RegistrationService } from './registration.service';
import { RegistrationController } from './registration.controller';
import { Team } from './team.entity';

/**
 * Registration Module
 * Manages tournament registrations.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Registration, Team, Tournament, Category, Club, User]),
    UserModule,
  ],
  controllers: [RegistrationController],
  providers: [RegistrationService],
  exports: [RegistrationService, TypeOrmModule],
})
export class RegistrationModule {}
