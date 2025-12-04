import { Module } from '@nestjs/common';
import { PromotionalAndFeaturedController } from './promotional-and-featured.controller';
import { PromotionalAndFeaturedService } from './promotional-and-featured.service';

@Module({
  controllers: [PromotionalAndFeaturedController],
  providers: [PromotionalAndFeaturedService],
})
export class PromotionalAndFeaturedModule {}
