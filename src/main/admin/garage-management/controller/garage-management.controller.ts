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
import { SearchGarageDto } from '../dto/filter.grage.dto';
import {
  UpdateGarageDto,
  UpdateGarageStatusDto,
} from '../dto/garage-management.dto';
import { GarageManagementService } from '../service/garage-management.service';

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
  @ApiOperation({ summary: 'Update garage info...' })
  @Patch(':id')
  updateGarageInfo(
    @Param('id') id: string,
    @Body() updateGarageDto: UpdateGarageDto,
  ) {
    return this.garageManagementService.updateGarageInfo(id, updateGarageDto);
  }

  // -----------update garage status by garage ID ---
  @ValidateAuth()
  @ApiBearerAuth()
  @ValidateSuperAdmin()
  @ApiOperation({
    summary:
      'Update garage status (APPROVE | PENDING | DECLINE) by providing garageId. This updates both the garage and its owner.',
  })
  @Patch('status/:garageId')
  updateStatus(
    @Param('garageId') garageId: string,
    @Body() updateGarageDto: UpdateGarageStatusDto,
  ) {
    return this.garageManagementService.updateStatus(garageId, updateGarageDto);
  }

  // -----------update garage status by garage ID (alternative endpoint) ------------------
  @ValidateAuth()
  @ApiBearerAuth()
  @ValidateSuperAdmin()
  @ApiOperation({
    summary:
      'Update individual garage status (APPROVE | PENDING | DECLINE) by providing garageId',
  })
  @Patch('garage-status/:garageId')
  updateGarageStatus(
    @Param('garageId') garageId: string,
    @Body() updateGarageDto: UpdateGarageStatusDto,
  ) {
    return this.garageManagementService.updateGarageStatusByGarageId(
      garageId,
      updateGarageDto,
    );
  }
  // --------------- update garage status by user ID -----------------
  @ValidateAuth()
  @ApiBearerAuth()
  @ValidateSuperAdmin()
  @ApiOperation({
    summary:
      'Update individual garage status (APPROVE | PENDING | DECLINE) by providing userId',
  })
  @Patch('user-garage-status/:userId')
  updateGarageStatusByUserId(
    @Param('userId') userId: string,
  
  ) {
    return this.garageManagementService.updateGarageStatusByUserId(
      userId,
    );
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
