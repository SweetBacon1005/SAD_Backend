import { Injectable } from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { GetNotificationsDto } from './dto/get-notifications.dto';
import { GetNotificationsResponseDto } from './dto/notification-response.dto';

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  async createNotification(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: any;
  }) {
    return this.prisma.notification.create({
      data,
    });
  }

  async getNotifications(
    payload: GetNotificationsDto,
  ): Promise<GetNotificationsResponseDto> {
    const currentPage = Number(payload.currentPage) ?? 1;
    const pageSize = Number(payload.pageSize) ?? 20;
    const skip = (currentPage - 1) * pageSize;

    const where: Prisma.NotificationWhereInput = {
      userId: payload.userId,
      ...(payload.isRead !== undefined && { isRead: payload.isRead }),
    };

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      currentPage,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      data: notifications,
    };
  }

  async markAsRead(id: string, userId: string) {
    return this.prisma.notification.update({
      where: {
        id,
        userId,
      },
      data: {
        isRead: true,
      },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
  }

  async deleteNotification(id: string, userId: string) {
    return this.prisma.notification.delete({
      where: {
        id,
        userId,
      },
    });
  }

  async deleteAllNotifications(userId: string) {
    return this.prisma.notification.deleteMany({
      where: {
        userId,
      },
    });
  }
}
