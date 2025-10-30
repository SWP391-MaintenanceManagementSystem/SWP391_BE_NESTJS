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
import { ChatStatus } from '@prisma/client';
import { JWT_Payload } from '../types';

@UseGuards(WsJwtGuard)
@WebSocketGateway({ namespace: '/chat', cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(ChatGateway.name);

  // Map userId -> socketId
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
    }
  }

  @SubscribeMessage('register')
  register(client: Socket) {
    const user = client.data.user as JWT_Payload;
    if (!user) {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }
    this.onlineUsers.set(user.sub, client.id);
    this.logger.log(`[ONLINE] ${user.sub} (${client.id})`);
  }

  @SubscribeMessage('message')
  async handleMessage(client: Socket, data: { message: string; conversationId?: string }) {
    const senderId = [...this.onlineUsers.entries()].find(
      ([, socketId]) => socketId === client.id
    )?.[0];

    if (!senderId) {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }

    if (!data.message || data.message.trim() === '') {
      client.emit('error', { message: 'Message content is required' });
      return;
    }

    try {
      const savedMessage = await this.chatService.createMessage(senderId, {
        content: data.message.trim(),
        conversationId: data.conversationId,
      });
      if (!savedMessage.conversationId) throw new Error('Conversation not found');
      const conversation = await this.chatService.getConversationById(savedMessage.conversationId);

      if (conversation.staffId) {
        const staffSocket = this.onlineUsers.get(conversation.staffId);
        if (staffSocket) {
          this.server.to(staffSocket).emit('message', savedMessage);
        }
      } else {
        this.server.emit('new_ticket', savedMessage);
      }

      client.emit('message_sent', savedMessage);
    } catch (error) {
      client.emit('error', { message: 'Failed to send message' });
      this.logger.error(error);
    }
  }

  @SubscribeMessage('claim_ticket')
  async claimTicket(client: Socket, conversationId: string) {
    const staffId = [...this.onlineUsers.entries()].find(
      ([, socketId]) => socketId === client.id
    )?.[0];

    if (!staffId) {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }

    const conversation = await this.chatService.assignStaffToConversation(conversationId, staffId);

    client.emit('ticket_claimed', conversation);

    this.server.emit('ticket_updated', conversation);
  }
}
