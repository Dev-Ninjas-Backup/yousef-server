import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetUser, ValidateGarageOwner } from 'src/common/jwt/jwt.decorator';
import { InquiriesService } from './inquiries.service';

@Controller('Garage-admin-inquiries')
@ApiTags('Inquiries')
export class InquiriesController {
  constructor(private readonly inquiriesService: InquiriesService) { }

  // ------------ GET CUSTOMER INQUIRIES ------------
  @ValidateGarageOwner()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get customer inquiries' })
  @Get('customer-inquiries')
  async GetCustomerInquiries(@GetUser('userId') userId: string) {
    return this.inquiriesService.getCustomerInquiries(userId);
  }

  // ----------------custom inquiries mesages ----------------

  @ValidateGarageOwner()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get custom inquiries messages' })
  @Get('custom-inquiries')
  async GetCustomInquiries(@GetUser('userId') userId: string) {
    return this.inquiriesService.getCustomInquiries(userId);
  }


}
