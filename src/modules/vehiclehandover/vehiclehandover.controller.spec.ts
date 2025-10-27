import { Test, TestingModule } from '@nestjs/testing';
import { VehicleHandoverController } from './vehiclehandover.controller';
import { VehicleHandoverService } from './vehiclehandover.service';

describe('VehicleHandoverController', () => {
  let controller: VehicleHandoverController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VehicleHandoverController],
      providers: [VehicleHandoverService],
    }).compile();

    controller = module.get<VehicleHandoverController>(VehicleHandoverController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
