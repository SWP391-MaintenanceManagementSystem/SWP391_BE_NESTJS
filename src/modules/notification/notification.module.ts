import { Module, forwardRef, Global } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { WebsocketModule } from 'src/common/socket/socket.module';

@Global() // Make it global so interceptor can inject it
@Module({
  imports: [PrismaModule, forwardRef(() => WebsocketModule)],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
