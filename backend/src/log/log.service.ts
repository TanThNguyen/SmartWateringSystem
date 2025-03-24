import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateLogDto, FindAllLogsDto, GetLogsRequestDto, InfoLogDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class LogService {
    constructor(private prismaService: PrismaService) { }

    async create(createLogDto: CreateLogDto): Promise<string> {
        try {
            if (createLogDto.deviceId) {
                const device = await this.prismaService.device.findUnique({
                    where: { deviceId: createLogDto.deviceId },
                });

                if (!device) {
                    throw new BadRequestException('Thiết bị không tồn tại');
                }
            }

            const logData = {
                userId: createLogDto.userId?.trim() ? createLogDto.userId : null,
                deviceId: createLogDto.deviceId?.trim() ? createLogDto.deviceId : null,
                eventType: createLogDto.eventType,
                description: createLogDto.description,
            };

            await this.prismaService.log.create({
                data: logData,
            });
            return 'Tạo log thành công';
        } catch (error) {
            throw new InternalServerErrorException(error.message || 'Lỗi khi tạo log');
        }
    }

    async getAll(query: GetLogsRequestDto): Promise<FindAllLogsDto> {
        try {
            const page = Number(query.page) || 1;
            const items_per_page = Number(query.items_per_page) || 5;
            const skip = (page - 1) * items_per_page;

            const [logs, total] = await Promise.all([
                this.prismaService.log.findMany({
                    where: {
                        description: query.search ? { contains: query.search, mode: 'insensitive' } : undefined,
                        eventType: query.eventType !== 'ALL' ? query.eventType : undefined,
                    },
                    orderBy: {
                        createdAt: query.order === 'asc' ? 'asc' : 'desc',
                    },
                    take: items_per_page,
                    skip: skip,
                }),
                this.prismaService.log.count({
                    where: {
                        description: query.search ? { contains: query.search, mode: 'insensitive' } : undefined,
                        eventType: query.eventType !== 'ALL' ? query.eventType : undefined,
                    },
                }),
            ]);

            const lastPage = Math.ceil(total / items_per_page);
            const nextPage = page + 1 > lastPage ? null : page + 1;
            const prevPage = page - 1 < 1 ? null : page - 1;

            const formattedLogs: InfoLogDto[] = logs.map(log => ({
                logId: log.logId,
                userId: log.userId ?? '',
                deviceId: log.deviceId ?? '',
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
            throw new InternalServerErrorException('Lỗi khi lấy danh sách log');
        }
    }
}
