import { Module } from '@nestjs/common';
import { SubscribeService } from './services/subscribe.service';
import { subscribeController } from './controller/subscribe.controller';


@Module({
  
  controllers: [subscribeController],
  providers: [SubscribeService],
})
export class SubscribeModule {}
