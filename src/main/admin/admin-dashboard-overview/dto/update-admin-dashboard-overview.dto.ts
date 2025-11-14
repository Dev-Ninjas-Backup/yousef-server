import { PartialType } from '@nestjs/swagger';
import { CreateAdminDashboardOverviewDto } from './create-admin-dashboard-overview.dto';

export class UpdateAdminDashboardOverviewDto extends PartialType(CreateAdminDashboardOverviewDto) {}
