import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateNotiDto, FindAllNotisDto, InfoNotiDto } from './dto';

@Injectable()
export class NotificationService {
  constructor(private prismaService: PrismaService) {}

  async create(data: CreateNotiDto): Promise<string> {
    const transaction = await this.prismaService.$transaction(async (prisma) => {
      try {
        const validRecipients = await prisma.user.findMany({
          where: { userId: { in: data.recipientIds } },
          select: { userId: true },
        });

        const validUserIds = validRecipients.map(user => user.userId);
        if (validUserIds.length !== data.recipientIds.length) {
          throw new NotFoundException('Một số người nhận không tồn tại');
        }

        const notification = await prisma.notification.create({
          data: {
            senderId: data.senderId ?? null,
            message: data.message,
            severity: data.severity,
            recipients: {
              create: validUserIds.map(userId => ({ userId })),
            },
          },
        });

        return notification.notificationId;
      } catch (error) {
        throw new NotFoundException('Không thể tạo thông báo');
      }
    });

    return transaction;
  }

  async getAll(userId: string): Promise<FindAllNotisDto> {
    try {
      const unreadNotis = await this.prismaService.notificationRecipient.findMany({
        where: { userId, isRead: false },
        include: { notification: true },
        orderBy: [
          { notification: { severity: 'desc' } },
          { notification: { createdAt: 'desc' } },
        ],
      });

      if (unreadNotis.length < 15) {
        const readNotis = await this.prismaService.notificationRecipient.findMany({
          where: { userId, isRead: true },
          include: { notification: true },
          orderBy: { notification: { createdAt: 'desc' } },
          take: 15 - unreadNotis.length,
        });

        const allNotis = [
          ...unreadNotis,
          ...readNotis
        ].map(n => this.mapToInfoNotiDto(n));

        return { notifications: allNotis };
      }

      const unreadNotisMapped = unreadNotis.map(n => this.mapToInfoNotiDto(n));
      return { notifications: unreadNotisMapped };
    } catch (error) {
      throw new NotFoundException('Không thể lấy thông báo');
    }
  }

  private mapToInfoNotiDto(notificationRecipient: any): InfoNotiDto {
    const { notification, isRead } = notificationRecipient;
    return {
      notificationId: notification.notificationId,
      senderId: notification.senderId ?? '',
      message: notification.message,
      severity: notification.severity,
      isRead,
      createdAt: notification.createdAt,
    };
  }

  async getOne(userId: string, notificationId: string): Promise<string> {
    const transaction = await this.prismaService.$transaction(async (prisma) => {
      try {
        const recipient = await prisma.notificationRecipient.findFirst({
          where: { userId, notificationId },
          include: { notification: true },
        });

        if (!recipient) {
          throw new NotFoundException('Thông báo không tồn tại');
        }

        if (!recipient.isRead) {
          await prisma.notificationRecipient.update({
            where: { notificationId_userId: { notificationId, userId } },
            data: { isRead: true },
          });
        }

        return recipient.notification.message;
      } catch (error) {
        throw new NotFoundException('Không thể lấy thông báo');
      }
    });

    return transaction;
  }

  async getUnreadCount(userId: string): Promise<number> {
    try {
      return this.prismaService.notificationRecipient.count({
        where: { userId, isRead: false },
      });
    } catch (error) {
      throw new NotFoundException('Không thể lấy số lượng thông báo chưa đọc');
    }
  }
}
