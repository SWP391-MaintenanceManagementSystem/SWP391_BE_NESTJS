import { Module } from '@nestjs/common';
import { VehicleHandoverController } from './vehiclehandover.controller';
import { VehicleHandoverService } from './vehiclehandover.service';

@Module({
  controllers: [VehicleHandoverController],
  providers: [VehicleHandoverService],
})
export class VehicleHandoverModule {}
