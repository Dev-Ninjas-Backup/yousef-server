import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NearbyGarageQueryDto } from '../dto/nearby-garage.dto';
import {
  GarageWithDistance,
  LocationgarageService,
} from './../service/locaticon.garage.service';

@ApiTags('Garages-location-nearby')
@Controller('garages')
export class LocationGarageController {
  constructor(private readonly LocationgarageService: LocationgarageService) {}

  @Get('nearby')
  @ApiOperation({ summary: 'Find nearby garages by location or address' })
  @ApiResponse({ status: 200, description: 'List of nearby garages' })
  @ApiResponse({ status: 400, description: 'Invalid request parameters' })
  async findNearbyGarages(@Query() query: NearbyGarageQueryDto): Promise<{
    success: boolean;
    data: {
      garages: GarageWithDistance[];
      searchLocation: { lat: number; lng: number; address: string | null };
      pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
      radius: number;
    };
  }> {
    return this.LocationgarageService.findNearbyGarages(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get garage details by ID' })
  @ApiResponse({ status: 200, description: 'Garage details' })
  @ApiResponse({ status: 404, description: 'Garage not found' })
  async getGarageById(
    @Param('id') id: string,
    @Query('userLat') userLat?: number,
    @Query('userLng') userLng?: number,
  ): Promise<{ success: boolean; data: any }> {
    return this.LocationgarageService.getGarageById(id, userLat, userLng);
  }
}
