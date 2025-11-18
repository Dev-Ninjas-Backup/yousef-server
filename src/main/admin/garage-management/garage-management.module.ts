import { Module } from '@nestjs/common';
import { GarageManagementController } from './controller/garage-management.controller';
import { GarageManagementService } from './service/garage-management.service';

@Module({
  controllers: [GarageManagementController],
  providers: [GarageManagementService],
})
export class GarageManagementModule {}
