import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Category } from '../category/category.entity';
import { Club } from '../club/club.entity';
import { User } from '../user/user.entity';

import { TournamentCategory } from './tournament-category.entity';
import { TournamentController } from './tournament.controller';
import { Tournament } from './tournament.entity';
import { TournamentService } from './tournament.service';

/**
 * Tournament Module
 * Manages tournament entities and operations.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Tournament, TournamentCategory, Category, Club, User])],
  controllers: [TournamentController],
  providers: [TournamentService],
  exports: [TournamentService, TypeOrmModule],
})
export class TournamentModule {}
