import { Module } from '@nestjs/common';
import { PlatformSubscribeService } from './platform-subscribe.service';
import { PlatformSubscribeController } from './platform-subscribe.controller';

@Module({
  controllers: [PlatformSubscribeController],
  providers: [PlatformSubscribeService],
})
export class PlatformSubscribeModule {}
