import { Module } from '@nestjs/common';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { PaymentService } from 'src/main/shared/payment/service/payment.service';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';

@Module({
  controllers: [SubscriptionController],
  providers: [SubscriptionService, PrismaService, PaymentService],
})
export class SubscriptionModule { }