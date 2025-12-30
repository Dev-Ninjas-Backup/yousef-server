import { Body, Controller, Delete, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  GetUser,
  ValidateGarageOwner,
  ValidateUser,
} from 'src/common/jwt/jwt.decorator';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { CreateGarageAdminReplyDto } from './dto/inquiryreply.dto';
import { InquiriesService } from './inquiries.service';

@Controller('Garage-admin-inquiries')
@ApiTags('Garage-admin-Inquiries')
export class InquiriesController {
  constructor(private readonly inquiriesService: InquiriesService) {}

  // ----------------custom inquiries messages ----------------

  @ValidateGarageOwner()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get custom inquiries messages' })
  @Get('custom-inquiries')
  async GetCustomInquiries(@GetUser('userId') userId: string) {
    return this.inquiriesService.getCustomInquiries(userId);
  }

  // -------------- reply inquery message -------------

  @ApiBearerAuth()
  @ValidateGarageOwner()
  @ApiOperation({ summary: 'Garage owner reply to inquiry message' })
  @Post('reply-inquiry-message')
  async ReplyInquiryMessage(
    @Body() dto: CreateGarageAdminReplyDto,
    @GetUser('userId') userId: string,
  ) {
    return this.inquiriesService.replyInquiryMessage(dto, userId);
  }
  // ---------------crate custom inquiries messages ---------------

  @ApiBearerAuth()
  @ValidateUser()
  @ApiOperation({
    summary:
      'Create custom inquiries messages || when select OTHERS as subject then otherSubject is required-',
  })
  @Post('create-custom-inquiries')
  async CreateCustomInquiries(
    @Body() payload: CreateInquiryDto,
    @GetUser('userId') userId: string,
  ) {
    return this.inquiriesService.createCustomInquiriesMessages(payload, userId);
  }
  // ------------delete custom  query content id inquiries message -------------

  @ApiBearerAuth()
  @ValidateGarageOwner()
  @ApiOperation({ summary: 'Delete custom inquiries message' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        contactId: {
          type: 'string',
          format: 'uuid',
          example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          description: 'Contact ID to delete',
        },
      },
      required: ['contactId'],
    },
  })
  @Delete('delete-custom-inquiries')
  async DeleteCustomInquiries(@Body('contactId') contactId: string) {
    return this.inquiriesService.DeleteCustomInquiries(contactId);
  }
}
