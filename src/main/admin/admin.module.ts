import { Module } from '@nestjs/common';
import { GarageManagementModule } from './garage-management/garage-management.module';
import { AdminDashboardOverviewModule } from './admin-dashboard-overview/admin-dashboard-overview.module';
import { UserManagementModule } from './user-management/user-management.module';
import { AdminSettingModule } from './admin-setting/admin-setting.module';
import { AdminMessageModule } from './admin-message/admin-message.module';
import { SparepartsFinancialsModule } from './spareparts-financials/spareparts-financials.module';

@Module({
  controllers: [],
  providers: [],
  imports: [
    GarageManagementModule,
    AdminDashboardOverviewModule,
    UserManagementModule,
    AdminSettingModule,
    AdminMessageModule,
    SparepartsFinancialsModule,
  ],
})
export class AdminModule {}
