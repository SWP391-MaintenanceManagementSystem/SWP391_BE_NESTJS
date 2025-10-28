import { Module } from '@nestjs/common';
import { VehicleHandoverController } from './vehiclehandover.controller';
import { VehicleHandoverService } from './vehiclehandover.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [PrismaModule, UploadModule],
  controllers: [VehicleHandoverController],
  providers: [VehicleHandoverService],
  exports: [VehicleHandoverService],
})
export class VehicleHandoverModule {}
