import { Module } from '@nestjs/common';
import { GarageController } from './controller/garage.controller';
import { GarageService } from './service/garage.service';

@Module({
  controllers: [GarageController],
  providers: [GarageService]
})
export class GarageModule {}
