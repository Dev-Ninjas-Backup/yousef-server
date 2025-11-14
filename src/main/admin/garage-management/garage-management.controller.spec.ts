import { Test, TestingModule } from '@nestjs/testing';
import { GarageManagementController } from './garage-management.controller';
import { GarageManagementService } from './garage-management.service';

describe('GarageManagementController', () => {
  let controller: GarageManagementController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GarageManagementController],
      providers: [GarageManagementService],
    }).compile();

    controller = module.get<GarageManagementController>(GarageManagementController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
