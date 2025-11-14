import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AdminMessageService } from './admin-message.service';
import { CreateAdminMessageDto } from './dto/create-admin-message.dto';
import { UpdateAdminMessageDto } from './dto/update-admin-message.dto';

@Controller('admin-message')
export class AdminMessageController {
  constructor(private readonly adminMessageService: AdminMessageService) {}

  @Post()
  create(@Body() createAdminMessageDto: CreateAdminMessageDto) {
    return this.adminMessageService.create(createAdminMessageDto);
  }

  @Get()
  findAll() {
    return this.adminMessageService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.adminMessageService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAdminMessageDto: UpdateAdminMessageDto) {
    return this.adminMessageService.update(+id, updateAdminMessageDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.adminMessageService.remove(+id);
  }
}
