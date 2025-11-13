// src/main/stripepayment/tasks/trial-expiry.module.ts
import { Module } from '@nestjs/common';
import { UtilsModule } from 'src/lib/utils/utils.module';
import { ScheduleService } from './schedule.service';
import { LibModule } from 'src/lib/lib.module';

@Module({
  imports: [UtilsModule, LibModule],
  providers: [ScheduleService],
})
export class ScheduleModule {}
