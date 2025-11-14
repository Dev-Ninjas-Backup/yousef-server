import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';

import { PaymentModule } from './shared/payment/payment.module';
import { ScheduleModule } from '@nestjs/schedule';

import { awsModule } from './shared/aws/aws.module';

import { TestawsModule } from './testaws/testaws.module';
import { UsersModule } from './users/users.module';
import { ContactModule } from './shared/contact/contact.module';
import { AdminModule } from './admin/admin.module';
import { PartsFinancialsModule } from './parts-financials/parts-financials.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    AuthModule,
    ContactModule,
    PaymentModule,
    awsModule,
    TestawsModule,
    UsersModule,
    AdminModule,
    PartsFinancialsModule,
  ],
  controllers: [],
  providers: [],
})
export class MainModule {}
