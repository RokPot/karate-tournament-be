import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Club } from './club.entity';
import { ClubService } from './club.service';
import { ClubController } from './club.controller';

/**
 * Club Module
 * Manages club entities and operations.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Club])],
  controllers: [ClubController],
  providers: [ClubService],
  exports: [ClubService, TypeOrmModule],
})
export class ClubModule {}

