import { Module } from '@nestjs/common';

import { SubscribeModule } from './shared/subscribe/subscribe.module';

import { AuthModule } from './auth/auth.module';

import { PaymentModule } from './shared/payment/payment.module';
import { ScheduleModule } from '@nestjs/schedule';

import { awsModule } from './shared/aws/aws.module';

import { TestawsModule } from './testaws/testaws.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    AuthModule,
    SubscribeModule,
    PaymentModule,
    awsModule,
    TestawsModule,
    UsersModule,
  ],
  controllers: [],
  providers: [],
})
export class MainModule {}
