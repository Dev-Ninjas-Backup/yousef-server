import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';

import { ScheduleModule } from '@nestjs/schedule';
import { PaymentModule } from './shared/payment/payment.module';

import { awsModule } from './shared/aws/aws.module';

import { AdminModule } from './admin/admin.module';
import { GarageModule } from './garage/garage.module';
import { ServiceTypeModule } from './service-type/service-type.module';
import { ContactModule } from './shared/contact/contact.module';
import { TestawsModule } from './testaws/testaws.module';
import { UsersModule } from './users/users.module';

import { GarageAdminModule } from './garage-admin/garage-admin.module';
import { ReviewModule } from './review/review.module';
import { GarageLocationModule } from './shared/garage-location/garage-location.module';
import { PrivateMessageModule } from './shared/private-message/private-message.module';
import { PromotionalAndFeaturedModule } from './promotional-and-featured/promotional-and-featured.module';

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
    GarageModule,
    ServiceTypeModule,
    GarageAdminModule,
    PrivateMessageModule,
    ReviewModule,
    GarageLocationModule,
    PromotionalAndFeaturedModule,
  ],
  controllers: [],
  providers: [],
})
export class MainModule {}
