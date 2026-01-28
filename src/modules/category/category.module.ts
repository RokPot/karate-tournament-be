import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Tournament } from '../tournament/tournament.entity';

import { CategoryController } from './category.controller';
import { Category } from './category.entity';
import { CategoryService } from './category.service';

/**
 * Category Module
 * Manages category entities and operations.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Category, Tournament])],
  controllers: [CategoryController],
  providers: [CategoryService],
  exports: [CategoryService, TypeOrmModule],
})
export class CategoryModule {}
