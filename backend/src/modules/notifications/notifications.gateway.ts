import {
  WebSocketGateway, WebSocketServer,
  OnGatewayConnection, OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  namespace: 'notifications',
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private connections = new Map<string, string>(); // userId -> socketId

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) this.connections.set(userId, client.id);
  }

  handleDisconnect(client: Socket) {
    for (const [uid, sid] of this.connections) {
      if (sid === client.id) { this.connections.delete(uid); break; }
    }
  }

  sendToUser(userId: string, notification: any) {
    const sid = this.connections.get(userId);
    if (sid) this.server.to(sid).emit('notification', notification);
  }

  broadcast(userIds: string[], notification: any) {
    userIds.forEach(uid => this.sendToUser(uid, notification));
  }
}
