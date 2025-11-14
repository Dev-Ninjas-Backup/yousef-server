import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ValidateAuth, ValidateGarageOwner } from 'src/common/jwt/jwt.decorator';
import { FileType, MulterService } from 'src/lib/multer/multer.service';
import { CreateServiceTypeDto } from '../dto/create-service.dto';
import { UpdateServiceTypeDto } from '../dto/update-service.dto';
import { ServiceTypeService } from '../service/service-type.service';

@ApiTags('Service Type')
@Controller('services')
export class ServiceTypeController {
  constructor(private readonly serviceTypeService: ServiceTypeService) { }

  @ValidateAuth()
  @ApiBearerAuth()
  @ValidateGarageOwner()
  @Post()
  @ApiOperation({ summary: 'Create a new service' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor(
      [{ name: 'icon', maxCount: 1 }],
      new MulterService().createMulterOptions('./Uploads', 'services', FileType.IMAGE)
    )
  )
  async create(
    @Body() dto: CreateServiceTypeDto,
    @UploadedFiles() files: { icon?: Express.Multer.File[] } = {},
    @Request() req,
  ) {
    const iconFile = files.icon?.[0];
    return this.serviceTypeService.create(dto, { icon: iconFile }, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all services' })
  findAll() {
    return this.serviceTypeService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get service by ID' })
  findOne(@Param('id') id: string) {
    return this.serviceTypeService.findOne(id);
  }

  @ValidateAuth()
  @ApiBearerAuth()
  @ValidateGarageOwner()
  @Patch(':id')
  @ApiOperation({ summary: 'Update service' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor(
      [{ name: 'icon', maxCount: 1 }],
      new MulterService().createMulterOptions('./Uploads', 'services', FileType.IMAGE)
    )
  )
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateServiceTypeDto,
    @UploadedFiles() files: { icon?: Express.Multer.File[] } = {},
    @Request() req,
  ) {
    const iconFile = files.icon?.[0];
    return this.serviceTypeService.update(id, dto, { icon: iconFile }, req.user);
  }

  @ValidateAuth()
  @ApiBearerAuth()
  @ValidateGarageOwner()
  @Delete(':id')
  @ApiOperation({ summary: 'Delete service' })
  remove(@Param('id') id: string, @Request() req) {
    return this.serviceTypeService.remove(id, req.user);
  }
}