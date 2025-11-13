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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';



import { CreateSubscribeDto } from '../dto/create-subscribe.dto';
import { ValidateAdmin } from 'src/common/jwt/jwt.decorator';
import { PaginationDto } from 'src/common/dto/pagination';
import { SubscribeService } from '../services/subscribe.service';
@ApiTags('subscribe')
@Controller('subscribe')
export class subscribeController {
  constructor(private readonly subscribeService:SubscribeService ) {}
  @ApiOperation({ summary: 'Create a new contact' })
  @Post()
  create(@Body() createsubscribeDto: CreateSubscribeDto) {
    return this.subscribeService.create(createsubscribeDto);
  }

  // ----------get all subscribe for admin---------------
  @ApiOperation({ summary: 'Get all subscribe' })
  @ValidateAdmin()
  @ApiBearerAuth()
  @Get('admin')
  @Get()
  findAll(@Query() pg: PaginationDto) {
    return this.subscribeService.findAll(pg);
  }
  // ------------get subscribe by id for admin----------------
  @ApiOperation({ summary: 'Get a subscribe by ID' })
  @ValidateAdmin()
  @ApiBearerAuth()
  @Get('admin/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.subscribeService.findOne(id);
  }


  @ApiOperation({ summary: 'Delete a subscribe by ID' })
  @ValidateAdmin()
  @ApiBearerAuth()
  @Delete('admin/:id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.subscribeService.remove(id);
  }
}