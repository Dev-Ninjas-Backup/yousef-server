import { Module } from '@nestjs/common';
import { GarageAdminSettingsController } from './garage-admin-settings.controller';
import { GarageAdminSettingsService } from './garage-admin-settings.service';

@Module({
  controllers: [GarageAdminSettingsController],
  providers: [GarageAdminSettingsService],
})
export class GarageAdminSettingsModule {}
