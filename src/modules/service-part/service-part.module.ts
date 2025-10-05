import { Module } from '@nestjs/common';
import { ServicePartService } from './service-part.service';
import { ServicePartController } from './service-part.controller';

@Module({
  controllers: [ServicePartController],
  providers: [ServicePartService],
})
export class ServicePartModule {}
