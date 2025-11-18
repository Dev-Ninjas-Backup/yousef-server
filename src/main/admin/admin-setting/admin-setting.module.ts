import { Module } from '@nestjs/common';
import { AdminSettingController } from './controller/admin-setting.controller';
import { PartsCategoryModule } from './parts-category/parts-category.module';
import { AdminSettingService } from './service/admin-setting.service';

@Module({
  controllers: [AdminSettingController],
  providers: [AdminSettingService],
  imports: [PartsCategoryModule],
})
export class AdminSettingModule {}
