import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { getConfigFactory } from '~common/config';

import { Club } from '../club/club.entity';
import { User } from '../user/user.entity';

import { Invitation } from './invitation.entity';
import { InvitationConfig } from './invitation.config';
import { InvitationService } from './invitation.service';
import { InvitationController } from './invitation.controller';

/**
 * Invitation Module
 * Handles club owner invitations: create (from club create), get by token (public), accept (auth).
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Invitation, Club, User]),
    //
  ],
  controllers: [InvitationController],
  providers: [getConfigFactory(InvitationConfig), InvitationService],
  exports: [InvitationService, TypeOrmModule],
})
export class InvitationModule {}
