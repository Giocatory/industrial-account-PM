import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ChatService } from './chat.service';

@WebSocketGateway({
  namespace: 'chat',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(ChatGateway.name);

  // userId -> Set of socketIds (user can have multiple tabs)
  private userSockets = new Map<string, Set<string>>();

  constructor(private chatService: ChatService) {}

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (!userId) return;
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(client.id);
    client.data.userId = userId;
    this.logger.log(`Chat: user ${userId} connected (${client.id})`);
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      const sockets = this.userSockets.get(userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) this.userSockets.delete(userId);
      }
    }
  }

  @SubscribeMessage('joinProject')
  handleJoinProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId: string },
  ) {
    client.join(`project:${data.projectId}`);
    this.logger.log(`User ${client.data.userId} joined project room: ${data.projectId}`);
  }

  @SubscribeMessage('leaveProject')
  handleLeaveProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId: string },
  ) {
    client.leave(`project:${data.projectId}`);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      projectId?: string;
      recipientId?: string;
      content: string;
      senderId: string;
    },
  ) {
    if (!data.content?.trim()) return;

    const message = await this.chatService.saveMessage({
      projectId: data.projectId,
      senderId: data.senderId || client.data.userId,
      recipientId: data.recipientId,
      content: data.content.trim(),
    });

    if (data.projectId) {
      // Broadcast to everyone in the project room (including sender)
      this.server
        .to(`project:${data.projectId}`)
        .emit('newMessage', message);
    } else if (data.recipientId) {
      // Direct message
      this.emitToUser(data.recipientId, 'newMessage', message);
      client.emit('newMessage', message);
    }

    return message;
  }

  @SubscribeMessage('markRead')
  async handleMarkRead(
    @MessageBody() data: { messageIds: string[] },
  ) {
    await this.chatService.markRead(data.messageIds || []);
  }

  emitToUser(userId: string, event: string, data: any) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.forEach(socketId => {
        this.server.to(socketId).emit(event, data);
      });
    }
  }
}
