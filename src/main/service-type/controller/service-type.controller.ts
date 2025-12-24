import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  GetUser,
  ValidateAuth,
  ValidateGarageOwner,
} from 'src/common/jwt/jwt.decorator';
import { CreateServiceTypeDto } from '../dto/create-service.dto';
import { ServiceTypeService } from '../service/service-type.service';

@ApiTags('Service Type')
@Controller('services')
export class ServiceTypeController {
  constructor(private readonly serviceTypeService: ServiceTypeService) {}

  @ValidateGarageOwner()
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Add service category to user' })
  async create(
    @Body() dto: CreateServiceTypeDto,
    @GetUser('userId') userId: string,
  ) {
    return this.serviceTypeService.addServiceCategory(
      dto.serviceCategory,
      userId,
    );
  }

  @ValidateAuth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all service categories' })
  @Get()
  async getCombinedCategories(@GetUser('userId') userId: string) {
    return this.serviceTypeService.getCombinedUniqueServiceCategories(userId);
  }

  @ValidateGarageOwner()
  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Get user service categories' })
  findAll(@GetUser('userId') userId: string) {
    return this.serviceTypeService.getUserServiceCategories(userId);
  }
}
