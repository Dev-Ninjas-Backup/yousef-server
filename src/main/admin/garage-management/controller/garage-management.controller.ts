// garage-management.controller.ts

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ValidateAuth, ValidateSuperAdmin } from 'src/common/jwt/jwt.decorator';
import {
  UpdateGarageDto,
  UpdateGarageStatusDto,
} from '../dto/garage-management.dto';
import { GarageManagementService } from '../service/garage-management.service';
import { SearchGarageDto } from '../dto/filter.grage.dto';

@Controller('garage-management')
@ApiTags('Admin-Garage-Management')
export class GarageManagementController {
  constructor(
    private readonly garageManagementService: GarageManagementService,
  ) {}

  @ValidateAuth()
  @ApiBearerAuth()
  @ValidateSuperAdmin()
  @ApiOperation({ summary: 'Get all garage info' })
  @Get('admin')
  getAllGarage() {
    return this.garageManagementService.getAllGarage();
  }

  @Get('search')
  async searchGarages(@Query() dto: SearchGarageDto) {
    return this.garageManagementService.searchGarages(dto);
  }

  @ValidateAuth()
  @ApiBearerAuth()
  @ValidateSuperAdmin()
  @ApiOperation({ summary: 'Get garage info by id' })
  @Get('info/:id')
  getGarageInfo(@Param('id') id: string) {
    return this.garageManagementService.getGarageInfoById(id);
  }

  @ValidateAuth()
  @ApiBearerAuth()
  @ValidateSuperAdmin()
  @ApiOperation({ summary: 'Update garage info' })
  @Patch(':id')
  updateGarageInfo(
    @Param('id') id: string,
    @Body() updateGarageDto: UpdateGarageDto,
  ) {
    return this.garageManagementService.updateGarageInfo(id, updateGarageDto);
  }

  // -----------only update garage status ---
  @ValidateAuth()
  @ApiBearerAuth()
  @ValidateSuperAdmin()
  @ApiOperation({
    summary: 'Update garage status || APPROVE PENDING || DECLINE || ',
  })
  @Patch('status/:id')
  updateStatus(
    @Param('id') id: string,
    @Body() updateGarageDto: UpdateGarageStatusDto,
  ) {
    return this.garageManagementService.updateStatus(id, updateGarageDto);
  }

  @ValidateAuth()
  @ApiBearerAuth()
  @ValidateSuperAdmin()
  @ApiOperation({ summary: 'Delete garage info' })
  @Delete('info/:id')
  deleteGarageInfo(@Param('id') id: string) {
    return this.garageManagementService.softDeleteGarage(id);
  }
}
