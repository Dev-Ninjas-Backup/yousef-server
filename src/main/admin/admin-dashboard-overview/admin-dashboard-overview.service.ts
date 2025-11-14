import { Injectable } from '@nestjs/common';
import { CreateAdminDashboardOverviewDto } from './dto/create-admin-dashboard-overview.dto';
import { UpdateAdminDashboardOverviewDto } from './dto/update-admin-dashboard-overview.dto';

@Injectable()
export class AdminDashboardOverviewService {
  create(createAdminDashboardOverviewDto: CreateAdminDashboardOverviewDto) {
    return 'This action adds a new adminDashboardOverview';
  }

  findAll() {
    return `This action returns all adminDashboardOverview`;
  }

  findOne(id: number) {
    return `This action returns a #${id} adminDashboardOverview`;
  }

  update(
    id: number,
    updateAdminDashboardOverviewDto: UpdateAdminDashboardOverviewDto,
  ) {
    return `This action updates a #${id} adminDashboardOverview`;
  }

  remove(id: number) {
    return `This action removes a #${id} adminDashboardOverview`;
  }
}
