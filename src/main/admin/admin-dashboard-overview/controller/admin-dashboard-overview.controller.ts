import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
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
  // @ValidateAuth()
  // @ValidateSuperAdmin()
  // @ApiBearerAuth()
  // @Get('parts-category')
  // getPartsCategory(): Promise<any> {
  //   return this.adminDashboardOverviewService.getPartsCategory();
  // }

  @ApiBearerAuth()
  @ValidateAuth()
  @ValidateSuperAdmin()
  @Get('parts-category')
  @ApiOperation({
    summary: 'Get parts category statistics with product count and percentage',
  })
  @ApiResponse({
    status: 200,
    description: 'Parts category statistics retrieved successfully',
  })
  async getStatistics() {
    return this.adminDashboardOverviewService.getStatistics();
  }
  //  ------------------ Revenue trends for monthly---------------------

  @ApiBearerAuth()
  @ValidateAuth()
  @ValidateSuperAdmin()
  @Get('revenue-trends')
  @ApiOperation({
    summary: 'Get revenue trends for the last 30 days',
  })
  @ApiResponse({
    status: 200,
    description: 'Revenue trends retrieved successfully',
  })
  async getRevenueTrends() {
    return this.adminDashboardOverviewService.getRevenueTrends();
  }
}
