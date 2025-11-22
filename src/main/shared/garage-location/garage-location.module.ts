import { Module } from '@nestjs/common';

import { LocationGarageController } from './controller/location.garage.controller';
import { LocationgarageService } from './service/locaticon.garage.service';

@Module({
  controllers: [LocationGarageController],
  providers: [LocationgarageService],
})
export class GarageLocationModule {}
