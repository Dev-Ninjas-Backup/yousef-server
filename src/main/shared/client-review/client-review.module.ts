import { Module } from '@nestjs/common';
import { ClientReviewService } from './client-review.service';
import { ClientReviewController } from './client-review.controller';

@Module({
  controllers: [ClientReviewController],
  providers: [ClientReviewService],
})
export class ClientReviewModule {}
