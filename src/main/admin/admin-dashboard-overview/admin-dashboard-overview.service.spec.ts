import { Test, TestingModule } from '@nestjs/testing';
import { AdminDashboardOverviewService } from './admin-dashboard-overview.service';

describe('AdminDashboardOverviewService', () => {
  let service: AdminDashboardOverviewService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminDashboardOverviewService],
    }).compile();

    service = module.get<AdminDashboardOverviewService>(AdminDashboardOverviewService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
