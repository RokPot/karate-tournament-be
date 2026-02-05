import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { InvitationModule } from '../invitation/invitation.module';
import { Tournament } from '../tournament/tournament.entity';
import { UserModule } from '../user/user.module';

import { ClubController } from './club.controller';
import { Club } from './club.entity';
import { ClubService } from './club.service';

/**
 * Club Module
 * Manages club entities and operations.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Club, Tournament]), InvitationModule, UserModule],
  controllers: [ClubController],
  providers: [ClubService],
  exports: [ClubService, TypeOrmModule],
})
export class ClubModule {}
