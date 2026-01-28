import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../user/user.entity';
import { Tournament } from './tournament.entity';
import { TournamentService } from './tournament.service';
import { TournamentController } from './tournament.controller';

/**
 * Tournament Module
 * Manages tournament entities and operations.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Tournament, User])],
  controllers: [TournamentController],
  providers: [TournamentService],
  exports: [TournamentService, TypeOrmModule],
})
export class TournamentModule {}
