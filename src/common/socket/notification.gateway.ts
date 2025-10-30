import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({ namespace: '/notifications', cors: { origin: '*' } })
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger = new Logger('NotificationGateway');

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join')
  handleJoinRoom(client: Socket, userId: string) {
    client.join(`user:${userId}`);
    this.logger.log(`Client ${client.id} joined room user:${userId}`);
    return { success: true, message: `Joined room user:${userId}` };
  }

  @SubscribeMessage('leave')
  handleLeaveRoom(client: Socket, userId: string) {
    client.leave(`user:${userId}`);
    this.logger.log(`Client ${client.id} left room user:${userId}`);
    return { success: true, message: `Left room user:${userId}` };
  }

  sendNotification(userId: string, message: string) {
    this.server.to(`user:${userId}`).emit('notification', {
      message,
      timestamp: new Date(),
    });
    this.logger.log(`Sent notification to user:${userId}`);
  }

  sendNotificationWithData(userId: string, data: any) {
    this.server.to(`user:${userId}`).emit('notification', {
      ...data,
      timestamp: new Date(),
    });
    this.logger.log(`Sent notification with data to user:${userId}`);
  }
}
