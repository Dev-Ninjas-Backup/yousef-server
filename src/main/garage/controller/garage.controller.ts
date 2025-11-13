import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { GarageService } from '../service/garage.service';
import { CreateGarageDto } from '../dto/create-garage.dto';
import { UpdateGarageDto } from '../dto/update-garage.dto';

@ApiTags('Garages')
@Controller('garages')
export class GarageController {
  constructor(private readonly garageService: GarageService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new garage' })
  @ApiBody({ type: CreateGarageDto })
  @ApiResponse({ status: 201, description: 'The garage has been successfully created.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  create(@Body() createGarageDto: CreateGarageDto) {
    console.log("Test debug");
    return this.garageService.create(createGarageDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all garages' })
  @ApiResponse({ status: 200, description: 'List of all garages with related data.' })
  findAll() {
    return this.garageService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a garage by ID' })
  @ApiParam({ name: 'id', description: 'UUID of the garage', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 200, description: 'The garage details.' })
  @ApiResponse({ status: 404, description: 'Garage not found.' })
  findOne(@Param('id') id: string) {
    return this.garageService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a garage by ID' })
  @ApiParam({ name: 'id', description: 'UUID of the garage', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiBody({ type: UpdateGarageDto })
  @ApiResponse({ status: 200, description: 'The garage has been updated.' })
  @ApiResponse({ status: 404, description: 'Garage not found.' })
  update(@Param('id') id: string, @Body() updateGarageDto: UpdateGarageDto) {
    return this.garageService.update(id, updateGarageDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a garage by ID' })
  @ApiParam({ name: 'id', description: 'UUID of the garage', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({ status: 204, description: 'The garage has been deleted.' })
  @ApiResponse({ status: 404, description: 'Garage not found.' })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.garageService.remove(id);
  }
}
