import { Test, TestingModule } from '@nestjs/testing';
import { GarageManagementService } from './garage-management.service';

describe('GarageManagementService', () => {
  let service: GarageManagementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GarageManagementService],
    }).compile();

    service = module.get<GarageManagementService>(GarageManagementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
