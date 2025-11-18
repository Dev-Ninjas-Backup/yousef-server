import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ValidateAuth, ValidateSuperAdmin } from 'src/common/jwt/jwt.decorator';
import {
  AdminDashboardOverviewService,
  DashboardOverview,
  RecentActivityItem,
} from '../service/admin-dashboard-overview.service';

@ApiTags('Admin-dashboard overview monitor performace')
@Controller('admin-dashboard-overview')
export class AdminDashboardOverviewController {
  constructor(
    private readonly adminDashboardOverviewService: AdminDashboardOverviewService,
  ) {}

  // ----------------Dashboard-overview-----------
  @ValidateAuth()
  @ValidateSuperAdmin()
  @ApiBearerAuth()
  @Get('monitor-platform')
  getDashboardOverview(): Promise<DashboardOverview> {
    return this.adminDashboardOverviewService.getDashboardOverview();
  }

  // ----------recent activity-----------------
  @ValidateAuth()
  @ValidateSuperAdmin()
  @ApiBearerAuth()
  @Get('recent-activity')
  getRecentActivity(): Promise<RecentActivityItem[]> {
    return this.adminDashboardOverviewService.getRecentActivity();
  }

  // ---------------partsCategory show parts category name & percentage ---
  @ValidateAuth()
  @ValidateSuperAdmin()
  @ApiBearerAuth()
  @Get('parts-category')
  getPartsCategory(): Promise<any> {
    return this.adminDashboardOverviewService.getPartsCategory();
  }

  // ----------revenue  next working process-----------------
  @ValidateAuth()
  @ValidateSuperAdmin()
  @ApiBearerAuth()
  @Get('revenue')
  getRevenue(): Promise<any> {
    return this.adminDashboardOverviewService.getPartsCategory();
  }
}
