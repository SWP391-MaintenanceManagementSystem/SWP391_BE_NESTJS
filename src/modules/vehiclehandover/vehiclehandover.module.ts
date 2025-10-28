import { Module } from '@nestjs/common';
import { VehicleHandoverController } from './vehiclehandover.controller';
import { VehicleHandoverService } from './vehiclehandover.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CloudinaryService } from '../upload/cloudinary.service';

@Module({
  imports: [PrismaModule],
  controllers: [VehicleHandoverController],
  providers: [VehicleHandoverService, CloudinaryService],
  exports: [VehicleHandoverService],
})
export class VehicleHandoverModule {}
