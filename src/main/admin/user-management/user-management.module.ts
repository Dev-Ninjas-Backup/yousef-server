import { Module } from '@nestjs/common';
import { UserManagementController } from './controller/user-management.controller';
import { UserManagementService } from './service/user-management.service';

@Module({
  controllers: [UserManagementController],
  providers: [UserManagementService],
})
export class UserManagementModule {}
