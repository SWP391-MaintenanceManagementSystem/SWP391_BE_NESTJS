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
import { JWT_Payload } from '../types';

@UseGuards(WsJwtGuard)
@WebSocketGateway({ namespace: '/chat', cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(ChatGateway.name);
  private onlineUsers = new Map<string, string>(); // userId -> socketId

  constructor(private readonly chatService: ChatService) {}

  // Handle new socket connection
  handleConnection(client: Socket) {
    this.logger.log(`[CONNECTED] ${client.id}`);
  }

  // Handle disconnection
  handleDisconnect(client: Socket) {
    const userId = [...this.onlineUsers.entries()].find(
      ([, socketId]) => socketId === client.id
    )?.[0];

    if (userId) {
      this.onlineUsers.delete(userId);
      this.logger.log(`[DISCONNECTED] ${userId} (${client.id})`);
    }
  }

  // 🧩 Register user (after successful JWT auth)
  @SubscribeMessage('register')
  async register(client: Socket) {
    const user = client.data.user as JWT_Payload;
    if (!user) {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }

    this.onlineUsers.set(user.sub, client.id);
    this.logger.log(`[ONLINE] ${user.sub} (${client.id})`);
    client.emit('registered', { message: 'Registered successfully.' });
  }

  // 💬 Handle new message
  @SubscribeMessage('message')
  async handleMessage(client: Socket, data: { message: string; conversationId?: string }) {
    const senderId = [...this.onlineUsers.entries()].find(
      ([, socketId]) => socketId === client.id
    )?.[0];

    if (!senderId) {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }

    if (!data.message?.trim()) {
      client.emit('error', { message: 'Message cannot be empty.' });
      return;
    }

    try {
      const message = await this.chatService.createMessage(senderId, {
        content: data.message.trim(),
        conversationId: data.conversationId,
      });

      const conversation = await this.chatService.getConversationById(message.conversationId!);

      const customerSocket = conversation.customerId
        ? this.onlineUsers.get(conversation.customerId)
        : null;

      const staffSocket = conversation.staffId ? this.onlineUsers.get(conversation.staffId) : null;

      if (!conversation.staffId) {
        this.server.emit('new_ticket', conversation);
      }

      if (customerSocket && customerSocket !== client.id) {
        this.server.to(customerSocket).emit('message', message);
      }

      if (staffSocket && staffSocket !== client.id) {
        this.server.to(staffSocket).emit('message', message);
      }

      client.emit('message_sent', message);
    } catch (err) {
      this.logger.error(err);
      client.emit('error', { message: 'Failed to send message.' });
    }
  }

  // Get user's conversations
  @SubscribeMessage('get_conversations')
  async getConversations(client: Socket) {
    const user = client.data.user as JWT_Payload;
    if (!user) {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }

    const conversations = await this.chatService.getUserConversations(user.sub);
    client.emit('conversations', conversations);
  }

  // Get messages for a conversation
  @SubscribeMessage('get_messages')
  async getMessages(client: Socket, conversationId: string) {
    const user = client.data.user as JWT_Payload;
    if (!user) {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }

    const messages = await this.chatService.getMessagesByConversation(conversationId, user.sub);
    client.emit('messages', messages);
  }

  // Staff claims a ticket
  @SubscribeMessage('claim_ticket')
  async claimTicket(client: Socket, conversationId: string) {
    const staffId = [...this.onlineUsers.entries()].find(
      ([, socketId]) => socketId === client.id
    )?.[0];

    if (!staffId) {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }

    try {
      const conversation = await this.chatService.assignStaffToConversation(
        conversationId,
        staffId
      );

      client.emit('ticket_claimed', conversation);
      this.server.emit('ticket_updated', conversation);
    } catch (err) {
      this.logger.error(err);
      client.emit('error', { message: 'Failed to claim ticket.' });
    }
  }

  // Staff closes a ticket
  @SubscribeMessage('close_ticket')
  async closeTicket(client: Socket, conversationId: string) {
    const staffId = [...this.onlineUsers.entries()].find(
      ([, socketId]) => socketId === client.id
    )?.[0];

    if (!staffId) {
      client.emit('error', { message: 'Unauthorized' });
      return;
    }

    try {
      const conversation = await this.chatService.closeConversation(conversationId, staffId);
      client.emit('ticket_closed', conversation);
      this.server.emit('ticket_updated', conversation);
    } catch (err) {
      this.logger.error(err);
      client.emit('error', { message: 'Failed to close ticket.' });
    }
  }
}
