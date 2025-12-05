import { Controller, Get, Patch } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GetUser, ValidateGarageOwner } from 'src/common/jwt/jwt.decorator';
import { GarageAdminSettingsService } from './garage-admin-settings.service';

@ApiTags('Garage Admin Settings')
@ApiBearerAuth()
@Controller('garage-admin-settings')
export class GarageAdminSettingsController {
  constructor(private readonly service: GarageAdminSettingsService) {}

  @ApiOperation({ summary: 'Get notification settings for garage admin' })
  @ApiResponse({ status: 200, description: 'Notification settings retrieved' })
  @ValidateGarageOwner()
  @Get('notifications')
  async getNotifications(@GetUser('userId') userId: string) {
    return this.service.getNotificationSettings(userId);
  }

  @ApiOperation({ summary: 'Toggle email notification preference' })
  @ValidateGarageOwner()
  @Patch('email-notification')
  async toggleEmailNotification(@GetUser('userId') userId: string) {
    return this.service.updateEmailNotification(userId);
  }

  @ApiOperation({ summary: 'Toggle customer inquiry alert preference' })
  @ValidateGarageOwner()
  @Patch('customer-inquiry-alert')
  async toggleCustomerInquiry(@GetUser('userId') userId: string) {
    return this.service.updateCustomerInquiryAlert(userId);
  }

  @ApiOperation({ summary: 'Toggle product approval notification preference' })
  @ValidateGarageOwner()
  @Patch('product-approval-update')
  async toggleProductApproval(@GetUser('userId') userId: string) {
    return this.service.updateProductApprovalUpdate(userId);
  }
}
