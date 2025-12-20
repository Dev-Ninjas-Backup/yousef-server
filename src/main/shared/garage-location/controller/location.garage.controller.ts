// src/garage-location/controller/location.garage.controller.ts

import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { NearbyGarageQueryDto } from '../dto/nearby-garage.dto';
import { LocationGarageService } from '../service/locaticon.garage.service';

@ApiTags('Garages-Nearby')
@Controller('garages')
export class LocationGarageController {
  constructor(private readonly locationGarageService: LocationGarageService) {}

  @Get('nearby')
  @ApiOperation({ summary: 'Get nearby garages based on user location' })
  @ApiQuery({
    name: 'lat',
    required: true,
    type: Number,
    description: 'Latitude',
  })
  @ApiQuery({
    name: 'lng',
    required: true,
    type: Number,
    description: 'Longitude',
  })
  @ApiQuery({
    name: 'radius',
    required: false,
    type: Number,
    description: 'Radius in km (default: 100)',
  })
  async findNearbyGarages(@Query() query: NearbyGarageQueryDto) {
    return this.locationGarageService.findNearbyGarages(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single garage details with optional distance' })
  @ApiQuery({ name: 'userLat', required: false, type: Number })
  @ApiQuery({ name: 'userLng', required: false, type: Number })
  async getGarageById(
    @Param('id') id: string,
    @Query('userLat') userLat?: number,
    @Query('userLng') userLng?: number,
  ) {
    return this.locationGarageService.getGarageById(id, userLat, userLng);
  }
}
