import { Module } from '@nestjs/common';
import { VehicleHandoverController } from './vehiclehandover.controller';
import { VehicleHandoverService } from './vehiclehandover.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [VehicleHandoverController],
  providers: [VehicleHandoverService],
  exports: [VehicleHandoverService],
})
export class VehicleHandoverModule {}
