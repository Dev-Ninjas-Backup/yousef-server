import { Module } from '@nestjs/common';
import { NotificationSettingService } from './service/notification-setting.service';
import { NotificationSettingController } from './controller/notification-setting.controller';

@Module({
  controllers: [NotificationSettingController],
  providers: [NotificationSettingService],
})
export class NotificationSettingModule {}
