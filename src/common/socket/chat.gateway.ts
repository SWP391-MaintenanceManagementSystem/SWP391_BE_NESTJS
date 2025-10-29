import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { UseGuards, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { WsJwtGuard } from '../guard/ws.guard';
import { ChatService } from '../../modules/chat/chat.service';

@UseGuards(WsJwtGuard)
@WebSocketGateway({ namespace: '/chat', cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(ChatGateway.name);

  private onlineUsers = new Map<string, string>();

  constructor(private readonly chatService: ChatService) {}

  handleConnection(client: Socket) {
    this.logger.log(`[CONNECTED] ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const userId = [...this.onlineUsers.entries()].find(
      ([, socketId]) => socketId === client.id
    )?.[0];

    if (userId) {
      this.onlineUsers.delete(userId);
      this.logger.log(`[OFFLINE] ${userId} (${client.id})`);
      this.broadcastOnlineUsers();
    }
  }

  @SubscribeMessage('register')
  register(client: Socket, userId: string) {
    this.onlineUsers.set(userId, client.id);
    this.logger.log(`[ONLINE] ${userId} (${client.id})`);
    this.broadcastOnlineUsers();
  }

  @SubscribeMessage('message')
  async handleMessage(
    client: Socket,
    data: { to: string; message: string; conversationId?: string }
  ) {
    const senderId = [...this.onlineUsers.entries()].find(
      ([, socketId]) => socketId === client.id
    )?.[0];

    if (!senderId) {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }

    try {
      const savedMessage = await this.chatService.createMessage(senderId, {
        receiverId: data.to,
        content: data.message,
        conversationId: data.conversationId,
      });

      const receiverSocketId = this.onlineUsers.get(data.to);
      if (receiverSocketId) {
        this.server.to(receiverSocketId).emit('message', savedMessage);
      }

      client.emit('message_sent', savedMessage);
    } catch (error) {
      client.emit('error', { message: 'Failed to send message' });
    }
  }

  @SubscribeMessage('get_online_users')
  getOnlineUsers(client: Socket) {
    client.emit('online_users', Array.from(this.onlineUsers.keys()));
  }

  private broadcastOnlineUsers() {
    const onlineList = Array.from(this.onlineUsers.keys());
    this.server.emit('online_users', onlineList);
  }
}
