import { Test, TestingModule } from '@nestjs/testing';
import { WorkCenterController } from './work-center.controller';
import { WorkCenterService } from './work-center.service';

describe('WorkCenterController', () => {
  let controller: WorkCenterController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkCenterController],
      providers: [WorkCenterService],
    }).compile();

    controller = module.get<WorkCenterController>(WorkCenterController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
