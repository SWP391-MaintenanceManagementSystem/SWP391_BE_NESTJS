import { Test, TestingModule } from '@nestjs/testing';
import { WorkScheduleService } from './work-schedule.service';

describe('WorkScheduleService', () => {
  let service: WorkScheduleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WorkScheduleService],
    }).compile();

    service = module.get<WorkScheduleService>(WorkScheduleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
