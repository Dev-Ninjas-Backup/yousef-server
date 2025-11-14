import { Module } from '@nestjs/common';
import { AdminSettingService } from './admin-setting.service';
import { AdminSettingController } from './admin-setting.controller';

@Module({
  controllers: [AdminSettingController],
  providers: [AdminSettingService],
})
export class AdminSettingModule {}
