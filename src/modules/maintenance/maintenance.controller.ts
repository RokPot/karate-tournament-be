import { Controller, HttpCode, HttpStatus, NotFoundException, Post, UseGuards } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';

import { requireAdmin } from '~common/auth';

import { CurrentUserEntity } from '../user/user.decorators';
import { User } from '../user/user.entity';

import { MaintenanceGuard } from './maintenance.guard';
import { MaintenanceService, type TournamentCleanupCounts } from './maintenance.service';

@ApiExcludeController()
@Controller('internal')
@UseGuards(MaintenanceGuard)
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Post('reset-tournament-data')
  @HttpCode(HttpStatus.OK)
  async resetTournamentData(
    @CurrentUserEntity() user: User,
  ): Promise<{ before: TournamentCleanupCounts; after: TournamentCleanupCounts }> {
    if (!user) {
      throw new NotFoundException('User not found');
    }
    requireAdmin(user.roles);
    return this.maintenanceService.resetTournamentData();
  }
}
