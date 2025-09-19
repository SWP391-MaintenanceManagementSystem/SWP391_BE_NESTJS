import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/modules/prisma/prisma.service';

@Injectable()
export class ScheduleService {
  private readonly logger = new Logger(ScheduleService.name);
  constructor(private readonly prisma: PrismaService) {}

  // @Cron(CronExpression.EVERY_5_SECONDS)
  // handleCron() {
  //     this.logger.debug('Cron job chạy mỗi 5 giây');
  // }

  @Cron(CronExpression.EVERY_HOUR)
  async handleRemoveExpireToken() {
    this.logger.debug('DELETE EXPIRED TOKEN');
    await this.prisma.token.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }
}
