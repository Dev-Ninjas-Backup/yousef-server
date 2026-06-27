import { Module } from '@nestjs/common';
import { ExclusiveOfferService } from './exclusive-offer.service';
import { ExclusiveOfferController } from './exclusive-offer.controller';

@Module({
  controllers: [ExclusiveOfferController],
  providers: [ExclusiveOfferService],
  exports: [ExclusiveOfferService],
})
export class ExclusiveOfferModule {}
