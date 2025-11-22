import { Module } from '@nestjs/common';
import { ProductModule } from './product/product.module';
import { PromotionalAdModule } from './promotional-ad/promotional-ad.module';

@Module({
  imports: [ProductModule, PromotionalAdModule],
})
export class GarageAdminModule { }
