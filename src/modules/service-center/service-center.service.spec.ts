import { Test, TestingModule } from '@nestjs/testing';
import { ServiceCenterService } from './service-center.service';

describe('ServiceCenterService', () => {
  let service: ServiceCenterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ServiceCenterService],
    }).compile();

    service = module.get<ServiceCenterService>(ServiceCenterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
