import { Module } from '@nestjs/common';
import { AdminSettingService } from './admin-setting.service';
import { AdminSettingController } from './admin-setting.controller';
import { PartsCategoryModule } from './parts-category/parts-category.module';

@Module({
  controllers: [AdminSettingController],
  providers: [AdminSettingService],
  imports: [PartsCategoryModule],
})
export class AdminSettingModule {}
