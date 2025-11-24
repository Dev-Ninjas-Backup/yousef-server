import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ValidateSuperAdmin } from 'src/common/jwt/jwt.decorator';
import { GeneralSettingDtoPlatform } from '../dto/platform.setting.dto';
import { UpdateFreePromotionListingDto } from '../dto/update-free-promotion.dto';
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
  // ------------- -------------------------------------------

  //----------------------- Approval settings ------------
  // --------------------------------------------------

  // ---------auto approval setting garage -----------
  @ApiBearerAuth()
  @ValidateSuperAdmin()
  @ApiOperation({ summary: 'auto approval setting garage' })
  @Patch('auto-approve-garages')
  autoApprovalSettingGarage() {
    return this.adminSettingService.autoApprovalSettingGarage();
  }
  // ----------email notify setting user -----------
  @ApiBearerAuth()
  @ValidateSuperAdmin()
  @ApiOperation({ summary: 'update email notification setting user' })
  @Patch('auto-email-notification')
  updateEmailNotificationForUser(
    @Body('isEmailNotification') isEmailNotification: boolean,
  ) {
    return this.adminSettingService.updateEmailNotificationForUser(
      isEmailNotification,
    );
  }
  // ------------ approval setting garage -----------
  @ApiBearerAuth()
  @ValidateSuperAdmin()
  @ApiOperation({ summary: 'update approval setting garage' })
  @Patch('auto-approval-garages')
  updateApprovalSettingGarage() {
    return this.adminSettingService.updateApprovalSettingGarage();
  }

  /* -------------------------------------------------------------
   ----------------- payment related setting-----------------
  
   -----------------------------------------------------
   
   */
  //---------------free promotion listing---------
  //
  @ApiBearerAuth()
  @ValidateSuperAdmin()
  @ApiOperation({ summary: 'Update free promotion listing' })
  @Patch('free-promotion-listing')
  updateFreePromotionProductListing(
    @Body() dto: UpdateFreePromotionListingDto,
  ) {
    return this.adminSettingService.updateFreePromotionProductListing(
      dto.value,
    );
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

  // ---------------------  freePromotionalListingStatus-------
  @ApiBearerAuth()
  @ValidateSuperAdmin()
  @ApiOperation({ summary: 'Update free promotional listing status' })
  @Patch('free-promotional-listing-status')
  updateFreePromotionalListingStatus() {
    return this.adminSettingService.updateFreePromotionalListingStatus();
  }
}
