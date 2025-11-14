import { Module } from '@nestjs/common';
import { LibModule } from 'src/lib/lib.module';
import { ServiceTypeService } from './service/service-type.service';
import { ServiceTypeController } from './controller/service-type.controller';

@Module({
  imports: [LibModule],
  controllers: [ServiceTypeController],
  providers: [ServiceTypeService],
})
export class ServiceTypeModule {}
