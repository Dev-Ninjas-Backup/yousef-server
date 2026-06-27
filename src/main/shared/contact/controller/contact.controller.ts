import {
  Body,
  Controller,
  Post,
  Get,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { GetUser, ValidateGarageOwner } from 'src/common/jwt/jwt.decorator';
import { CreateContactDto } from '../dto/create-subscribe.dto';
import { ContactService } from '../services/contact.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileType, MulterService } from 'src/lib/multer/multer.service';

@ApiTags('contact')
@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @ApiOperation({
    summary:
      'Create a new contact message || when select OTHERS as subject then otherSubject is required',
  })
  @Post()
  @UseInterceptors(
    FileInterceptor(
      'attachment',
      new MulterService().createMulterOptions(
        './Uploads',
        'contact',
        FileType.IMAGE,
        100 * 1024 * 1024,
      ),
    ),
  )
  create(
    @Body() dto: CreateContactDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.contactService.create(dto, file);
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

  @ApiOperation({
    summary: 'Webhook for inbound email replies from users/guests',
  })
  @Post('inbound-reply')
  handleInboundReply(
    @Body()
    dto: {
      from: string;
      subject: string;
      text?: string;
      html?: string;
      body?: string;
    },
  ) {
    return this.contactService.handleInboundEmail(dto);
  }
}
