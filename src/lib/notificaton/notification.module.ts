import { Global, Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { NotificationListener } from './ NotificationListener';
import { NotificationGateway } from './notification.gateway';

@Global()
@Module({
  providers: [NotificationGateway, JwtService, NotificationListener],
  controllers: [],
  exports: [NotificationGateway, NotificationListener],
})
export class NotificationModule { }
