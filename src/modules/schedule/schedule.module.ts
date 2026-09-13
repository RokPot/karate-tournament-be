import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Category } from '../category/category.entity';
import { Registration } from '../registration/registration.entity';
import { Team } from '../registration/team.entity';
import { TournamentCategory } from '../tournament/tournament-category.entity';
import { Tournament } from '../tournament/tournament.entity';
import { TournamentModule } from '../tournament/tournament.module';

import { Game } from './game.entity';
import { Match } from './match.entity';
import { ScheduleController } from './schedule.controller';
import { Schedule } from './schedule.entity';
import { ScheduleService } from './schedule.service';
import { Score } from './score.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Schedule,
      Game,
      Match,
      Score,
      Tournament,
      TournamentCategory,
      Category,
      Registration,
      Team,
    ]),
    TournamentModule,
  ],
  controllers: [ScheduleController],
  providers: [ScheduleService],
  exports: [ScheduleService, TypeOrmModule],
})
export class ScheduleModule {}
