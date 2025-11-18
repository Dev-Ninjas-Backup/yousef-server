import { Module } from '@nestjs/common';
import { FileService } from 'src/lib/file/file.service';
import { PrivateChatController } from './controller/private-message.controller';
import { PrivateChatGateway } from './privateChatGateway/privateChatGateway';
import { PrivateChatService } from './service/private-message.service';

@Module({
  controllers: [PrivateChatController],
  providers: [PrivateChatService, FileService, PrivateChatGateway],
})
export class PrivateMessageModule {}
