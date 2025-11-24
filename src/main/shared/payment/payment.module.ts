import { Module } from '@nestjs/common';
import { LibModule } from 'src/lib/lib.module';
import { PaymentController } from './controller/payment.controller';
import { ScheduleModule } from './schedule/schedule.module';
import { PaymentService } from './service/payment.service';

@Module({
  imports: [ScheduleModule, LibModule],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
