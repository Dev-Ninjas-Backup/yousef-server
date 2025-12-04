import { Controller, Patch } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ValidateGarageOwner } from 'src/common/jwt/jwt.decorator';
import { GarageAdminSettingsService } from './garage-admin-settings.service';

@Controller('garage-admin-settings')
export class GarageAdminSettingsController {
  constructor(
    private readonly garageAdminSettingsService: GarageAdminSettingsService,
  ) {}

  @ApiBearerAuth()
  @ValidateGarageOwner()
  @Patch('email-notification')
  async emailNotification() {
    return await this.garageAdminSettingsService.emailNotification();
  }

  @ApiBearerAuth()
  @ValidateGarageOwner()
  @Patch('customer-inquiry-alert')
  async customerInquiryAlert() {
    return await this.garageAdminSettingsService.customerInquiryAlert();
  }

  @ApiBearerAuth()
  @ValidateGarageOwner()
  @Patch('product-approval-update')
  async productApprovalUpdate() {
    return await this.garageAdminSettingsService.productApprovalUpdate();
  }
}
