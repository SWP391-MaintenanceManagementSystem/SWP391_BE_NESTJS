import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ namespace: '/noti', cors: { origin: '*' } })
export class NotificationGateway {
  @WebSocketServer() server: Server;

  sendNotification(userId: string, message: string) {
    this.server.emit(`notification:${userId}`, { message });
  }
}
