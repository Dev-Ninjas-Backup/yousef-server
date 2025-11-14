import { Module } from '@nestjs/common';
import { GarageManagementService } from './garage-management.service';
import { GarageManagementController } from './garage-management.controller';

@Module({
  controllers: [GarageManagementController],
  providers: [GarageManagementService],
})
export class GarageManagementModule {}
