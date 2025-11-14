import { Controller, Patch, Get } from '@nestjs/common';

import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { GetUser, ValidateAuth } from 'src/common/jwt/jwt.decorator';

import { AccountSettingService } from '../service/account-setting.service';

@ApiTags('USER Account settings')
@Controller('account-setting')
export class UserSettingAccountController {
  constructor(private readonly UserAccountSettings: AccountSettingService) {}

  

  // --------Review Alerts---

  @ApiBearerAuth()
  @ValidateAuth()
  @ApiOperation({ summary: 'Toggle Review Alerts for logged-in user' })
  @Patch('toggle-review-alerts')
  changeReviewAlert(@GetUser('userId') userId: string) {
    return this.UserAccountSettings.changeReviewAlert(userId);
  }

//   ------------------toggle email-notification------------
  @ApiBearerAuth()
  @ValidateAuth()
  @ApiOperation({ summary: 'Toggle email notification for logged-in user' })
  @Patch('toggle-email-notification')
  changeEmailNotification(@GetUser('userId') userId: string) {
    return this.UserAccountSettings.changeEmailNotification(userId);
  }
// ------------------  isSmsNotification--------------

@ApiBearerAuth()
@ValidateAuth()
@ApiOperation({ summary: 'Toggle SMS notification for logged-in user' })
@Patch('toggle-sms-notification')
changeSmsNotification(@GetUser('userId') userId: string) {
  return this.UserAccountSettings.changeSmsNotification(userId);
}

// ----------------- isEmailPromotional ---------------
@ApiBearerAuth()
@ValidateAuth()
@ApiOperation({ summary: 'Toggle email promotional for logged-in user' })
@Patch('toggle-email-promotional')
changeEmailPromotional(@GetUser('userId') userId: string) {
  return this.UserAccountSettings.changeEmailPromotional(userId);
}

// ----------------delete user-----------------
@ApiBearerAuth()
@ValidateAuth()
@ApiOperation({ summary: 'delete user' })
@Patch('delete-user')
deleteUser(@GetUser('userId') userId: string) {
  return this.UserAccountSettings.deleteUser(userId);
}
}
