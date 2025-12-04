import { Module } from '@nestjs/common';
import { LibModule } from 'src/lib/lib.module';
import { TestawsController } from './testaws.controller';
import { TestawsService } from './testaws.service';

@Module({
  imports: [LibModule],
  controllers: [TestawsController],
  providers: [TestawsService],
})
export class TestawsModule {}
