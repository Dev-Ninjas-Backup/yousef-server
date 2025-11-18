import { Module } from '@nestjs/common';
import { PromotionalAdController } from './promotional-ad.controller';
import { PromotionalAdService } from './promotional-ad.service';
import { LibModule } from '../../../lib/lib.module';

@Module({
  imports: [LibModule],
  controllers: [PromotionalAdController],
  providers: [PromotionalAdService],
  exports: [PromotionalAdService],
})
export class PromotionalAdModule {}
