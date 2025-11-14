import { Test, TestingModule } from '@nestjs/testing';
import { AdminMessageController } from './admin-message.controller';
import { AdminMessageService } from './admin-message.service';

describe('AdminMessageController', () => {
  let controller: AdminMessageController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminMessageController],
      providers: [AdminMessageService],
    }).compile();

    controller = module.get<AdminMessageController>(AdminMessageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
