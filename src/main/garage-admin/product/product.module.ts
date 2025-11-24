import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { PaymentModule } from '../../shared/payment/payment.module';
import { LibModule } from 'src/lib/lib.module';

@Module({
  imports: [PaymentModule, LibModule],
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}
