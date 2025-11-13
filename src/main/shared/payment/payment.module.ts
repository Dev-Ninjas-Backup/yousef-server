import { Module } from '@nestjs/common';
import { PaymentService } from './service/payment.service';
import { PaymentController } from './controller/payment.controller';
import { ScheduleModule } from './schedule/schedule.module';
import { LibModule } from 'src/lib/lib.module';
import { PaymentWebhookController } from './controller/paymentwebhook.controller';

@Module({
  imports: [ScheduleModule, LibModule],
  controllers: [PaymentController, PaymentWebhookController],
  providers: [PaymentService],
})
export class PaymentModule {}
