import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PaginationDto } from 'src/common/dto/pagination';
import { ValidateAdmin } from 'src/common/jwt/jwt.decorator';
import { CreateAdminSendmailDto } from './dto/admin-send-email.dto';
import { CreatePlatformSubscribeDto } from './dto/create-platform-subscribe.dto';
import { PlatformSubscribeService } from './platform-subscribe.service';

@Controller('platform-subscribe')
export class PlatformSubscribeController {
  constructor(
    private readonly platformSubscribeService: PlatformSubscribeService,
  ) {}

  @ApiOperation({ summary: 'Create a new contact' })
  @Post()
  create(@Body() createPlatformSubscribeDto: CreatePlatformSubscribeDto) {
    return this.platformSubscribeService.create(createPlatformSubscribeDto);
  }
  // ----------get all subscribe for admin---------------
  @ApiOperation({ summary: 'Get all subscribe' })
  @ValidateAdmin()
  @ApiBearerAuth()
  @Get('admin')
  @Get()
  findAll(@Query() pg: PaginationDto) {
    return this.platformSubscribeService.findAll(pg);
  }
  // ------------get subscribe by id for admin----------------
  @ApiOperation({ summary: 'Get a subscribe by ID' })
  @ValidateAdmin()
  @ApiBearerAuth()
  @Get('admin/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.platformSubscribeService.findOne(id);
  }

  @ApiOperation({ summary: 'Delete a subscribe by ID' })
  @ValidateAdmin()
  @ApiBearerAuth()
  @Delete('admin/:id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.platformSubscribeService.remove(id);
  }

  // ---------------send email all subscribe  user -----------------
  @ApiOperation({
    summary:
      'Send email to all subscribers on the platform subscribe || admin access need',
  })
  @ValidateAdmin()
  @ApiBearerAuth()
  @Post('admin/send-email')
  sendEmailAdmin(@Body() dto: CreateAdminSendmailDto) {
    return this.platformSubscribeService.sendEmailAdmin(dto);
  }
}
