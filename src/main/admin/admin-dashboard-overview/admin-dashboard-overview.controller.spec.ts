import { Test, TestingModule } from '@nestjs/testing';
import { AdminDashboardOverviewController } from './admin-dashboard-overview.controller';
import { AdminDashboardOverviewService } from './admin-dashboard-overview.service';

describe('AdminDashboardOverviewController', () => {
  let controller: AdminDashboardOverviewController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminDashboardOverviewController],
      providers: [AdminDashboardOverviewService],
    }).compile();

    controller = module.get<AdminDashboardOverviewController>(
      AdminDashboardOverviewController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
