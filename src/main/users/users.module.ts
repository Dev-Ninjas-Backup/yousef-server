import { Module } from '@nestjs/common';
import { UserController } from './controller/user.controller';
import { UserService } from './service/user.service';
import { UserSettingAccountController } from './controller/account-setting.controller';
import { AccountSettingService } from './service/account-setting.service';

@Module({
  controllers: [UserController, UserSettingAccountController],
  providers: [UserService, AccountSettingService],
})
export class UsersModule {}
