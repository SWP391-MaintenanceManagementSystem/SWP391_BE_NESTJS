import { Module } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { ScheduleController } from './schedule.controller';
import { ScheduleModule as _ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from 'src/modules/prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { CustomerModule } from '../customer/customer.module';
@Module({
  imports: [PrismaModule, _ScheduleModule.forRoot(), EmailModule, CustomerModule],
  controllers: [ScheduleController],
  providers: [ScheduleService],
  exports: [ScheduleService],
})
export class ScheduleModule {}
