import { Test, TestingModule } from '@nestjs/testing';
import { PartsFinancialsService } from './parts-financials.service';

describe('PartsFinancialsService', () => {
  let service: PartsFinancialsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PartsFinancialsService],
    }).compile();

    service = module.get<PartsFinancialsService>(PartsFinancialsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
