import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { AdminSettingService } from './admin-setting.service';
import { CreateAdminSettingDto } from './dto/create-admin-setting.dto';
import { UpdateAdminSettingDto } from './dto/update-admin-setting.dto';

@Controller('admin-setting')
export class AdminSettingController {
  constructor(private readonly adminSettingService: AdminSettingService) {}

  @Post()
  create(@Body() createAdminSettingDto: CreateAdminSettingDto) {
    return this.adminSettingService.create(createAdminSettingDto);
  }

  @Get()
  findAll() {
    return this.adminSettingService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.adminSettingService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAdminSettingDto: UpdateAdminSettingDto,
  ) {
    return this.adminSettingService.update(+id, updateAdminSettingDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.adminSettingService.remove(+id);
  }
}
