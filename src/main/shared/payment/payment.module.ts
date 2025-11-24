import { Module } from '@nestjs/common';
import { LibModule } from 'src/lib/lib.module';
import { PaymentController } from './controller/payment.controller';

import { PaymentService } from './service/payment.service';

@Module({
  imports: [LibModule],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule { }
