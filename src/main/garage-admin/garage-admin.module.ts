import { Module } from '@nestjs/common';
import { InquiriesModule } from './inquiries/inquiries.module';
import { OverviewModule } from './overview/overview.module';
import { ProductModule } from './product/product.module';
import { PromotionalAdModule } from './promotional-ad/promotional-ad.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { NotificationModule } from './notification/notification.module';

@Module({
  imports: [
    ProductModule,
    PromotionalAdModule,
    OverviewModule,
    SubscriptionModule,
    InquiriesModule,
    NotificationModule,
  ],
})
export class GarageAdminModule {}
