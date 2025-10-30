import { Global, Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { NotificationGateway } from './notification.gateway';
import { ChatModule } from '../../modules/chat/chat.module';
import { JwtModule } from '@nestjs/jwt';

@Global()
@Module({
  imports: [ChatModule, JwtModule],
  providers: [ChatGateway, NotificationGateway],
  exports: [ChatGateway, NotificationGateway],
})
export class WebsocketModule {}
