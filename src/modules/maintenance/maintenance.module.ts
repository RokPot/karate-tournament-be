import { Module } from '@nestjs/common';

import { getConfigFactory } from '~common/config';

import { MaintenanceConfig } from './maintenance.config';
import { MaintenanceController } from './maintenance.controller';
import { MaintenanceGuard } from './maintenance.guard';
import { MaintenanceService } from './maintenance.service';

@Module({
  controllers: [MaintenanceController],
  providers: [getConfigFactory(MaintenanceConfig), MaintenanceGuard, MaintenanceService],
})
export class MaintenanceModule {}
