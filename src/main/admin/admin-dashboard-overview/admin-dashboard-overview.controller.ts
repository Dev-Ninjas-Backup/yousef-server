import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AdminDashboardOverviewService } from './admin-dashboard-overview.service';
import { CreateAdminDashboardOverviewDto } from './dto/create-admin-dashboard-overview.dto';
import { UpdateAdminDashboardOverviewDto } from './dto/update-admin-dashboard-overview.dto';

@Controller('admin-dashboard-overview')
export class AdminDashboardOverviewController {
  constructor(private readonly adminDashboardOverviewService: AdminDashboardOverviewService) {}

  @Post()
  create(@Body() createAdminDashboardOverviewDto: CreateAdminDashboardOverviewDto) {
    return this.adminDashboardOverviewService.create(createAdminDashboardOverviewDto);
  }

  @Get()
  findAll() {
    return this.adminDashboardOverviewService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.adminDashboardOverviewService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAdminDashboardOverviewDto: UpdateAdminDashboardOverviewDto) {
    return this.adminDashboardOverviewService.update(+id, updateAdminDashboardOverviewDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.adminDashboardOverviewService.remove(+id);
  }
}
