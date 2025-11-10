import { Module } from '@nestjs/common';
import { PartService } from './part.service';
import { PartController } from './part.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';
import { RefillRequestService } from './refill-request.service';

@Module({
  imports: [PrismaModule, NotificationModule],
  controllers: [PartController],
  providers: [PartService, RefillRequestService],
})
export class PartModule {}
