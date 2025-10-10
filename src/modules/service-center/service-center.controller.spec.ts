import { Test, TestingModule } from '@nestjs/testing';
import { ServiceCenterController } from './service-center.controller';
import { ServiceCenterService } from './service-center.service';

describe('ServiceCenterController', () => {
  let controller: ServiceCenterController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServiceCenterController],
      providers: [ServiceCenterService],
    }).compile();

    controller = module.get<ServiceCenterController>(ServiceCenterController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
