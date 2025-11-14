import { Module } from '@nestjs/common';
import { AdminMessageController } from './controller/admin-message.controller';
import { AdminMessageService } from './service/admin-message.service';

@Module({
  controllers: [AdminMessageController],
  providers: [AdminMessageService],
})
export class AdminMessageModule {}
