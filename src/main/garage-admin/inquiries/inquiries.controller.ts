import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetUser, ValidateGarageOwner } from 'src/common/jwt/jwt.decorator';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { InquiriesService } from './inquiries.service';

@Controller('Garage-admin-inquiries')
@ApiTags('Garage-admin-Inquiries')
export class InquiriesController {
  constructor(private readonly inquiriesService: InquiriesService) { }


  // ----------------custom inquiries messages ----------------

  @ValidateGarageOwner()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get custom inquiries messages' })
  @Get('custom-inquiries')
  async GetCustomInquiries(@GetUser('userId') userId: string) {
    return this.inquiriesService.getCustomInquiries(userId);
  }

  // ---------------crate custom inquiries messages ---------------


  @ApiOperation({ summary: 'Create custom inquiries messages' })
  @Post('create-custom-inquiries')
  async CreateCustomInquiries(@Body() payload: CreateInquiryDto) {
    return this.inquiriesService.createCustomInquiriesMessages(payload);
  }


}
