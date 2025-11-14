import { Module } from '@nestjs/common';
import { AdminDashboardOverviewService } from './admin-dashboard-overview.service';
import { AdminDashboardOverviewController } from './admin-dashboard-overview.controller';

@Module({
  controllers: [AdminDashboardOverviewController],
  providers: [AdminDashboardOverviewService],
})
export class AdminDashboardOverviewModule {}
