import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { WebsocketModule } from '../../common/socket/socket.module';
import { ChatGateway } from '../../common/socket/chat.gateway';

@Module({
  imports: [WebsocketModule],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
  exports: [ChatService],
})
export class ChatModule {}
