import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { FindAllLogsDto, GetLogsRequestDto, InfoLogDto, LogEventPayload, LOG_EVENT } from './dto';
import { Prisma, Severity } from '@prisma/client';
import { OnEvent } from '@nestjs/event-emitter';

type PrismaConnect<T extends string, V extends string> = { connect: { [K in T]: V } };

@Injectable()
export class LogService {
    private readonly logger = new Logger(LogService.name);

    constructor(private prismaService: PrismaService) {}

    @OnEvent(LOG_EVENT, { async: true })
    async handleLogEvent(payload: LogEventPayload): Promise<void> {
        this.logger.debug(`Đang xử lý sự kiện log: ${JSON.stringify(payload)}`);
        try {
            
            let connectUser: PrismaConnect<'userId', string> | undefined = undefined;
            let connectDevice: PrismaConnect<'deviceId', string> | undefined = undefined;

            if (payload.deviceId) {
                const device = await this.prismaService.device.findUnique({
                    where: { deviceId: payload.deviceId },
                    select: { deviceId: true }
                });
                if (device) {
                    
                    connectDevice = { connect: { deviceId: payload.deviceId } };
                } else {
                    this.logger.warn(`Không tìm thấy thiết bị với ID ${payload.deviceId} khi cố gắng tạo log. Log sẽ được tạo mà không có liên kết thiết bị.`);
                }
            }

            if (payload.userId) {
                const user = await this.prismaService.user.findUnique({
                    where: { userId: payload.userId },
                    select: { userId: true }
                });
                if (user) {
                     
                    connectUser = { connect: { userId: payload.userId } };
                } else {
                    this.logger.warn(`Không tìm thấy người dùng với ID ${payload.userId} khi cố gắng tạo log. Log sẽ được tạo mà không có liên kết người dùng.`);
                }
            }

            const logData: Prisma.LogCreateInput = {
                eventType: payload.eventType,
                description: payload.description,
                
                ...(connectUser ? { user: connectUser } : {}),
                ...(connectDevice ? { device: connectDevice } : {}),
            };

            await this.prismaService.log.create({
                data: logData,
            });
            this.logger.log(`Đã lưu log thành công: ${payload.description}`);

        } catch (error) {
            this.logger.error(`Không thể xử lý sự kiện log: ${error.message}`, error.stack, JSON.stringify(payload));
        }
    }

    async getAll(query: GetLogsRequestDto): Promise<FindAllLogsDto> {
        try {
            const page = query.page;
            const items_per_page = query.items_per_page;
            const skip = (page - 1) * items_per_page;

            const where: Prisma.LogWhereInput = {
                description: query.search ? { contains: query.search, mode: 'insensitive' } : undefined,
                eventType: query.eventType !== 'ALL' ? query.eventType : undefined,
            };

            const orderBy: Prisma.LogOrderByWithRelationInput = {
                createdAt: query.order || 'desc',
            };

            const [logs, total] = await this.prismaService.$transaction([
                this.prismaService.log.findMany({
                    where,
                    orderBy,
                    take: items_per_page,
                    skip: skip,
                    select: {
                        logId: true,
                        userId: true,
                        deviceId: true,
                        eventType: true,
                        description: true,
                        createdAt: true,
                    }
                }),
                this.prismaService.log.count({ where }),
            ]);

            const lastPage = Math.ceil(total / items_per_page);
            const nextPage = page + 1 > lastPage ? null : page + 1;
            const prevPage = page - 1 < 1 ? null : page - 1;

            const formattedLogs: InfoLogDto[] = logs.map(log => ({
                logId: log.logId,
                userId: log.userId ?? null,
                deviceId: log.deviceId ?? null,
                eventType: log.eventType,
                description: log.description,
                createdAt: log.createdAt,
            }));

            return {
                logs: formattedLogs,
                total,
                currentPage: page,
                nextPage,
                prevPage,
                lastPage,
            };
        } catch (error) {
            this.logger.error(`Lỗi khi lấy danh sách log: ${error.message}`, error.stack);
            throw new InternalServerErrorException('Lỗi khi lấy danh sách log');
        }
    }
}