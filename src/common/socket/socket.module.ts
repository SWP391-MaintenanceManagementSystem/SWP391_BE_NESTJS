import { Module, forwardRef } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { NotificationGateway } from './notification.gateway';
import { ChatModule } from '../../modules/chat/chat.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [forwardRef(() => ChatModule), JwtModule],
  providers: [ChatGateway, NotificationGateway],
  exports: [ChatGateway, NotificationGateway],
})
export class WebsocketModule {}
