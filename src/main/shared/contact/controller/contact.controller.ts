import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateContactDto } from '../dto/create-subscribe.dto';
import { ContactService } from '../services/contact.service';

@ApiTags('contact')
@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @ApiOperation({
    summary:
      'Create a new contact message || when select OTHERS as subject then otherSubject is required',
  })
  @Post()
  create(@Body() dto: CreateContactDto) {
    return this.contactService.create(dto);
  }
}
