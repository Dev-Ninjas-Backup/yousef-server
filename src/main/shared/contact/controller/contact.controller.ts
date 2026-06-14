import { Body, Controller, Post, Get } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { GetUser, ValidateGarageOwner } from 'src/common/jwt/jwt.decorator';
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

  @ApiBearerAuth()
  @ValidateGarageOwner()
  @ApiOperation({
    summary: 'Get support tickets submitted by this garage owner',
  })
  @Get('my-tickets')
  getMyTickets(@GetUser('userId') userId: string) {
    return this.contactService.findByGarageOwner(userId);
  }

  @ApiBearerAuth()
  @ValidateGarageOwner()
  @ApiOperation({
    summary: 'Reply to an existing support ticket',
  })
  @Post('reply')
  replyTicket(
    @Body() dto: { contactId: string; content: string },
    @GetUser('userId') userId: string,
  ) {
    return this.contactService.replyTicket(dto.contactId, userId, dto.content);
  }
}
