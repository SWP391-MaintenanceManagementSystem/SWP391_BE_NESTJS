import { Test, TestingModule } from '@nestjs/testing';
import { VehicleHandoverService } from './vehiclehandover.service';

describe('VehicleHandoverService', () => {
  let service: VehicleHandoverService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VehicleHandoverService],
    }).compile();

    service = module.get<VehicleHandoverService>(VehicleHandoverService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
