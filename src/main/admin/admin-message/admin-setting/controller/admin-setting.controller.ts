import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ValidateSuperAdmin } from 'src/common/jwt/jwt.decorator';
import { GeneralSettingDtoPlatform } from '../dto/platform.setting.dto';
import { UpdatePaymentConfigureDto } from '../dto/update-payment-configure.dto';
import { AdminSettingService } from '../service/admin-setting.service';

@ApiTags('Admin-Settings => Approval setting, parts category')
@Controller('admin-setting')
export class AdminSettingController {
  constructor(private readonly adminSettingService: AdminSettingService) {}

  // ----------platform fee setting admin -----------
  @ApiBearerAuth()
  @ValidateSuperAdmin()
  @ApiOperation({ summary: 'Create or update platform setting' })
  @Post('platform-setting')
  createOrUpdatePlatformSetting(@Body() dto: GeneralSettingDtoPlatform) {
    return this.adminSettingService.createOrUpdatePlatformSetting(dto);
  }

  // ------------------getPlatformSetting------------
  @ApiBearerAuth()
  @ValidateSuperAdmin()
  @ApiOperation({ summary: 'get platform setting' })
  @Get('get-platform-setting')
  getPlatformSetting() {
    return this.adminSettingService.getPlatformSetting();
  }

  // ---------------------- Approval Settings-----------------

  @ApiBearerAuth()
  @ValidateSuperAdmin()
  @ApiOperation({
    summary:
      'GetApproval Settings Auto-approval parts toggle  parts toggle email notification toggle',
  })
  @Get('get-approval-settings')
  GetApprovalSettings() {
    return this.adminSettingService.GetApprovalSettings();
  }

  @ApiBearerAuth()
  @ValidateSuperAdmin()
  @ApiOperation({ summary: 'Toggle auto approval setting for garages' })
  @Patch('auto-approve-garages')
  toggleAutoApprovalGarages() {
    return this.adminSettingService.autoApprovalSettingGarage();
  }

  @ApiBearerAuth()
  @ValidateSuperAdmin()
  @ApiOperation({ summary: 'Toggle auto approval setting for parts' })
  @Patch('auto-approval-parts')
  toggleAutoApprovalParts() {
    return this.adminSettingService.autoupdateApprovalSettingParts();
  }

  @ApiBearerAuth()
  @ValidateSuperAdmin()
  @ApiOperation({ summary: 'Toggle email notification setting for users' })
  @Patch('auto-email-notification')
  updateEmailNotificationForUser() {
    return this.adminSettingService.updateEmailNotificationForUser(true);
  }

  // --------------------- payment configure --
  @ApiBearerAuth()
  @ValidateSuperAdmin()
  @ApiOperation({ summary: 'Get payment configure' })
  @Get('payment-config')
  getPaymentConfig() {
    return this.adminSettingService.getPaymentConfig();
  }
  @ValidateSuperAdmin()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update payment configure' })
  @Patch('payment-config')
  updatePaymentConfig(@Body() dto: UpdatePaymentConfigureDto) {
    return this.adminSettingService.updatePaymentConfig(dto);
  }

  // ---------------------  freePromotionalListingStatus --------------------------
  @ApiBearerAuth()
  @ValidateSuperAdmin()
  @ApiOperation({ summary: 'Update free promotional listing status' })
  @Patch('free-promotional-listing-status')
  updateFreePromotionalListingStatus() {
    return this.adminSettingService.updateFreePromotionalListingStatus();
  }
}
