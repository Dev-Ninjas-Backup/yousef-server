import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';

import { PaymentModule } from './shared/payment/payment.module';
import { ScheduleModule } from '@nestjs/schedule';

import { awsModule } from './shared/aws/aws.module';

import { TestawsModule } from './testaws/testaws.module';
import { UsersModule } from './users/users.module';
import { GarageModule } from './garage/garage.module';
import { ServiceTypeModule } from './service-type/service-type.module';
import { ContactModule } from './shared/contact/contact.module';
import { AdminModule } from './admin/admin.module';
import { PartsFinancialsModule } from './parts-financials/parts-financials.module';
import { GarageAdminModule } from './garage-admin/garage-admin.module';
import { PrivateMessageModule } from './shared/private-message/private-message.module';
import { ReviewModule } from './review/review.module';

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
    GarageModule,
    ServiceTypeModule,
    GarageAdminModule,
    PrivateMessageModule,
    ReviewModule,
  ],
  controllers: [],
  providers: [],
})
export class MainModule {}
