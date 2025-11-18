import { Module } from '@nestjs/common';
import { AdminDashboardOverviewController } from './controller/admin-dashboard-overview.controller';
import { AdminDashboardOverviewService } from './service/admin-dashboard-overview.service';

@Module({
  controllers: [AdminDashboardOverviewController],
  providers: [AdminDashboardOverviewService],
})
export class AdminDashboardOverviewModule {}
