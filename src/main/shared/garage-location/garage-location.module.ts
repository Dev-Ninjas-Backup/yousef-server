
import { Module } from '@nestjs/common';
import { LocationGarageController } from './controller/location.garage.controller';
import { GarageLocationGateway } from './Grage.gateway';
import { LocationGarageService } from './service/locaticon.garage.service';


@Module({
  controllers: [LocationGarageController],
  providers: [
    LocationGarageService,
    GarageLocationGateway,
  ],
  exports: [
    LocationGarageService,
    GarageLocationGateway,
  ],
})
export class GarageLocationModule { }
