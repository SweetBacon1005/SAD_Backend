import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets: Map<string, Socket[]> = new Map();

  constructor(private prisma: PrismaService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    for (const [userId, sockets] of this.userSockets.entries()) {
      const index = sockets.indexOf(client);
      if (index !== -1) {
        sockets.splice(index, 1);
        if (sockets.length === 0) {
          this.userSockets.delete(userId);
        }
      }
    }
  }

  @SubscribeMessage('join')
  handleJoin(client: Socket, userId: string) {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, []);
    }
    this.userSockets.get(userId)?.push(client);
    console.log(`User ${userId} joined with socket ${client.id}`);
  }

  async sendNotification(userId: string, notification: {
    type: NotificationType;
    title: string;
    message: string;
    data?: any;
  }) {
    const savedNotification = await this.prisma.notification.create({
      data: {
        userId,
        ...notification,
      },
    });

    const userSockets = this.userSockets.get(userId);
    if (userSockets) {
      userSockets.forEach(socket => {
        socket.emit('notification', savedNotification);
      });
    }

    return savedNotification;
  }
} 