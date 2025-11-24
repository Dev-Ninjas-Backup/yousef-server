import { Module } from '@nestjs/common';
import { ProductModule } from './product/product.module';
import { PromotionalAdModule } from './promotional-ad/promotional-ad.module';
import { OverviewModule } from './overview/overview.module';
import { SubscriptionModule } from './subscription/subscription.module';

@Module({
  imports: [ProductModule, PromotionalAdModule, OverviewModule, SubscriptionModule],
})
export class GarageAdminModule {}
