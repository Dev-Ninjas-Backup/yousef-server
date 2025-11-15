import { Module } from '@nestjs/common';
import { PromotionalAdController } from './promotional-ad.controller';
import { PromotionalAdService } from './promotional-ad.service';

@Module({
  controllers: [PromotionalAdController],
  providers: [PromotionalAdService]
})
export class PromotionalAdModule {}
