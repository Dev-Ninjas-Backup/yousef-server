import { Module } from '@nestjs/common';
import { ServiceTypeService } from './service/service-type.service';
import { ServiceTypeController } from './controller/service-type.controller';

@Module({
  controllers: [ServiceTypeController],
  providers: [ServiceTypeService]
})
export class ServiceTypeModule { }
