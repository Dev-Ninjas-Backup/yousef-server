import { Module } from '@nestjs/common';
import { TestawsService } from './testaws.service';
import { TestawsController } from './testaws.controller';

@Module({
  controllers: [TestawsController],
  providers: [TestawsService],
})
export class TestawsModule {}
