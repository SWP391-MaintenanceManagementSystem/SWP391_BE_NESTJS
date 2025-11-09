import { Test, TestingModule } from '@nestjs/testing';
import { WorkCenterService } from './work-center.service';

describe('WorkCenterService', () => {
  let service: WorkCenterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WorkCenterService],
    }).compile();

    service = module.get<WorkCenterService>(WorkCenterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
