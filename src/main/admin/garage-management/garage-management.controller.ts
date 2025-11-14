import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { GarageManagementService } from './garage-management.service';
import { CreateGarageManagementDto } from './dto/create-garage-management.dto';
import { UpdateGarageManagementDto } from './dto/update-garage-management.dto';

@Controller('garage-management')
export class GarageManagementController {
  constructor(
    private readonly garageManagementService: GarageManagementService,
  ) {}

  @Post()
  create(@Body() createGarageManagementDto: CreateGarageManagementDto) {
    return this.garageManagementService.create(createGarageManagementDto);
  }

  @Get()
  findAll() {
    return this.garageManagementService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.garageManagementService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateGarageManagementDto: UpdateGarageManagementDto,
  ) {
    return this.garageManagementService.update(+id, updateGarageManagementDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.garageManagementService.remove(+id);
  }
}
