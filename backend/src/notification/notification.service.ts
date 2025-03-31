import { Injectable, Logger, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { FindAllNotisDto, InfoNotiDto, NotificationEventPayload, NOTIFICATION_EVENT, NotificationEventContext } from './dto';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationRecipient, Prisma, Role, Severity, User } from '@prisma/client';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private prismaService: PrismaService) { }

  // async create(data: CreateNotiDto): Promise<string> {
  //   const transaction = await this.prismaService.$transaction(async (prisma) => {
  //     try {
  //       const validRecipients = await prisma.user.findMany({
  //         where: { userId: { in: data.recipientIds } },
  //         select: { userId: true },
  //       });

  //       const validUserIds = validRecipients.map(user => user.userId);
  //       if (validUserIds.length !== data.recipientIds.length) {
  //         throw new NotFoundException('Một số người nhận không tồn tại');
  //       }

  //       const notification = await prisma.notification.create({
  //         data: {
  //           senderId: data.senderId ?? null,
  //           message: data.message,
  //           severity: data.severity,
  //           recipients: {
  //             create: validUserIds.map(userId => ({ userId })),
  //           },
  //         },
  //       });

  //       return notification.notificationId;
  //     } catch (error) {
  //       throw new NotFoundException('Không thể tạo thông báo');
  //     }
  //   });

  //   return transaction;
  // }


  @OnEvent(NOTIFICATION_EVENT, { async: true })
  async handleNotificationEvent(payload: NotificationEventPayload): Promise<void> {
    this.logger.debug(`Đang xử lý sự kiện thông báo: ${JSON.stringify(payload)}`);
    try {
      const recipientIds = await this.determineRecipientIds(payload);

      if (!recipientIds || recipientIds.length === 0) {
        this.logger.warn(`Không tìm thấy người nhận hợp lệ cho sự kiện thông báo. Payload: ${JSON.stringify(payload)}`);
        return;
      }

      // Tạo message cuối cùng từ template và context (nếu cần)
      const finalMessage = this.formatMessage(payload.messageTemplate, payload.context);

      // Sử dụng transaction để đảm bảo tính nhất quán
      await this.prismaService.$transaction(async (prisma) => {
        const notification = await prisma.notification.create({
          data: {
            senderId: payload.senderId ?? null,
            message: finalMessage,
            severity: payload.severity,
            // Tạo các bản ghi NotificationRecipient liên kết
            recipients: {
              create: recipientIds.map(userId => ({ userId })),
            },
          },
          select: { notificationId: true } // Chỉ lấy ID để log
        });
        this.logger.log(`Đã tạo thông báo ${notification.notificationId} cho ${recipientIds.length} người nhận.`);
      });

    } catch (error) {
      this.logger.error(`Không thể xử lý sự kiện thông báo: ${error.message}`, error.stack, JSON.stringify(payload));
      // Có thể gửi một thông báo lỗi khác cho admin ở đây nếu cần
    }
  }

  private async determineRecipientIds(payload: NotificationEventPayload): Promise<string[]> {
    // Ưu tiên người nhận được chỉ định rõ ràng
    if (payload.explicitRecipientIds && payload.explicitRecipientIds.length > 0) {
      // Validate xem các ID này có tồn tại không (tùy chọn nhưng nên làm)
      const validUsers = await this.prismaService.user.findMany({
        where: { userId: { in: payload.explicitRecipientIds } },
        select: { userId: true }
      });
      return validUsers.map(u => u.userId);
    }

    // Logic xác định người nhận dựa trên context
    const context = payload.context;
    let recipientIds = new Set<string>();

    // Ví dụ: Thông báo liên quan đến thiết bị
    if (context?.deviceId) {
      const device = await this.prismaService.device.findUnique({
        where: { deviceId: context.deviceId },
        select: {
          locationId: true,
          // Có thể lấy thêm thông tin user quản lý trực tiếp thiết bị nếu có
        }
      });
      if (device?.locationId) {
        // Tìm người dùng (ví dụ: GARDENER) tại địa điểm đó
        const usersAtLocation = await this.prismaService.user.findMany({
          where: {
            locationId: device.locationId,
            role: { in: [Role.GARDENER, Role.ADMIN] } // Ví dụ: Thông báo cho Gardener và Admin
          },
          select: { userId: true }
        });
        usersAtLocation.forEach(user => recipientIds.add(user.userId));
      }
    }

    // Ví dụ: Thông báo lỗi hệ thống hoặc cảnh báo chung
    if (payload.severity === Severity.ERROR || payload.severity === Severity.WARNING) {
      // Tìm tất cả Admin
      const admins = await this.prismaService.user.findMany({
        where: { role: Role.ADMIN },
        select: { userId: true }
      });
      admins.forEach(admin => recipientIds.add(admin.userId));
    }

    // Ví dụ: Thông báo cho một người dùng cụ thể liên quan đến sự kiện
    if (context?.userId) {
      // Kiểm tra xem user này có tồn tại không
      const userExists = await this.prismaService.user.count({ where: { userId: context.userId } });
      if (userExists > 0) {
        recipientIds.add(context.userId);
      }
    }

    // Thêm các quy tắc xác định người nhận khác ở đây...

    return Array.from(recipientIds);
  }

  // Hàm helper để format message (có thể làm phức tạp hơn)
  private formatMessage(template: string, context?: NotificationEventContext): string {
    let message = template;
    if (context) {
      // Thay thế các placeholder đơn giản, ví dụ: {{deviceId}}, {{value}}
      for (const key in context) {
        if (Object.prototype.hasOwnProperty.call(context, key)) {
          const placeholder = `{{${key}}}`;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          message = message.replace(new RegExp(placeholder.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), (context as any)[key] ?? '');
        }
      }
    }
    // Xóa các placeholder không tìm thấy context (tùy chọn)
    message = message.replace(/\{\{\w+\}\}/g, '');
    return message;
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
