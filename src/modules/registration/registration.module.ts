import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MailModule } from '~common/mail';

import { CategoryFeeder } from '../category/category-feeder.entity';
import { Category } from '../category/category.entity';
import { Club } from '../club/club.entity';
import { Tournament } from '../tournament/tournament.entity';
import { User } from '../user/user.entity';
import { UserModule } from '../user/user.module';

import { RegistrationRosterOtp } from './registration-roster-otp.entity';
import { RegistrationRosterSession } from './registration-roster-session.entity';
import { RegistrationRosterService } from './registration-roster.service';
import { RegistrationSubmission } from './registration-submission.entity';
import { RegistrationController } from './registration.controller';
import { Registration } from './registration.entity';
import { RegistrationService } from './registration.service';
import { TeamMember } from './team-member.entity';
import { Team } from './team.entity';

/**
 * Registration Module
 * Manages tournament registrations.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Registration,
      RegistrationSubmission,
      RegistrationRosterOtp,
      RegistrationRosterSession,
      Team,
      TeamMember,
      Tournament,
      Category,
      CategoryFeeder,
      Club,
      User,
    ]),
    UserModule,
    MailModule,
  ],
  controllers: [RegistrationController],
  providers: [RegistrationService, RegistrationRosterService],
  exports: [RegistrationService, RegistrationRosterService, TypeOrmModule],
})
export class RegistrationModule {}
