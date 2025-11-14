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
import { PaginationDto } from 'src/common/dto/pagination';
import { ValidateAdmin } from 'src/common/jwt/jwt.decorator';
import { ContactService } from '../services/contact.service';
import { CreateContactDto } from '../dto/create-subscribe.dto';

@ApiTags('contact')
@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @ApiOperation({ summary: 'Create a new contact message' })
  @Post()
  create(@Body() dto: CreateContactDto) {
    return this.contactService.create(dto);
  }

  @ApiOperation({ summary: 'Get all contacts (Admin only)' })
  @ValidateAdmin()
  @ApiBearerAuth()
  @Get('admin')
  findAll(@Query() pg: PaginationDto) {
    return this.contactService.findAll(pg);
  }

  @ApiOperation({ summary: 'Get a contact by ID (Admin only)' })
  @ValidateAdmin()
  @ApiBearerAuth()
  @Get('admin/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.contactService.findOne(id);
  }

  @ApiOperation({ summary: 'Delete a contact by ID (Admin only)' })
  @ValidateAdmin()
  @ApiBearerAuth()
  @Delete('admin/:id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.contactService.remove(id);
  }
}
