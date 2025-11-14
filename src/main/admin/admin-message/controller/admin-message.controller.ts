// src/main/shared/admin-message/controllers/admin-message.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ENVEnum } from 'src/common/enum/env.enum';
import { ValidateAdmin } from 'src/common/jwt/jwt.decorator';

import { PaginationDto } from 'src/common/dto/pagination';
import { CreateAdminReplyDto } from '../dto/create-admin-message.dto';
import { AdminMessageService } from '../service/admin-message.service';

@ApiTags('admin-message')
@Controller('admin-message')
export class AdminMessageController {
  constructor(
    private readonly adminMessageService: AdminMessageService,
    private readonly configService: ConfigService,
  ) {}

  @ApiOperation({ summary: 'Admin replies to contact' })
  @ValidateAdmin()
  @ApiBearerAuth()
  @Post('reply')
  async reply(@Body() dto: CreateAdminReplyDto, @Req() req: any) {
    const adminEmail =
      req.user?.email ?? this.configService.get(ENVEnum.MAIL_USER);
    return this.adminMessageService.reply(dto, adminEmail);
  }

  @ApiOperation({ summary: 'Get all contacts (Admin only)' })
  @ValidateAdmin()
  @ApiBearerAuth()
  @Get('admin')
  findAll(@Query() pg: PaginationDto) {
    return this.adminMessageService.findAll(pg);
  }

  @ApiOperation({ summary: 'Get a contact by ID (Admin only)' })
  @ValidateAdmin()
  @ApiBearerAuth()
  @Get('admin/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminMessageService.findOne(id);
  }

  @ApiOperation({ summary: 'Delete a contact by ID (Admin only)' })
  @ValidateAdmin()
  @ApiBearerAuth()
  @Delete('admin/:id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminMessageService.remove(id);
  }
}
