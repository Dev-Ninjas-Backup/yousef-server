import { Test, TestingModule } from '@nestjs/testing';
import { AdminMessageService } from './admin-message.service';

describe('AdminMessageService', () => {
  let service: AdminMessageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminMessageService],
    }).compile();

    service = module.get<AdminMessageService>(AdminMessageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
