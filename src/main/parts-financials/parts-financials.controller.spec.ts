import { Test, TestingModule } from '@nestjs/testing';
import { PartsFinancialsController } from './parts-financials.controller';
import { PartsFinancialsService } from './parts-financials.service';

describe('PartsFinancialsController', () => {
  let controller: PartsFinancialsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PartsFinancialsController],
      providers: [PartsFinancialsService],
    }).compile();

    controller = module.get<PartsFinancialsController>(PartsFinancialsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
