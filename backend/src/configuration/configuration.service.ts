import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
    ConfigurationCreateDto,
    ConfigurationDeleteDto,
    ConfigurationFilterDto,
    ConfigurationQueryDto,
    ConfigurationUpdateDto,
    ConfigurationPaginatedDto,
    ConfigurationListDto
} from './dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LOG_EVENT, LogEventPayload } from 'src/log/dto';
import { DeviceType, Severity } from '@prisma/client';

@Injectable()
export class ConfigurationService {
    constructor(
        private readonly prisma: PrismaService,
        private eventEmitter: EventEmitter2,
    ) { }

    async create(data: ConfigurationCreateDto): Promise<string> {
        try {
            const configuration = await this.prisma.configuration.create({
                data: {
                    name: data.name,
                    value: data.value,
                    locationId: data.locationId,
                    deviceType: data.deviceType,
                },
            });

            // --- BỔ SUNG LOG ---
            const logPayloadSuccess: LogEventPayload = {
                eventType: Severity.INFO,
                description: `Cấu hình mới '${configuration.name}' (ID: ${configuration.configId}, Loại: ${configuration.deviceType}, Vị trí: ${configuration.locationId}) đã được tạo.`
            };
            this.eventEmitter.emit(LOG_EVENT, logPayloadSuccess);
            // --- KẾT THÚC BỔ SUNG ---

            return 'Tạo cấu hình thành công';
        } catch (error) {

            // --- BỔ SUNG LOG LỖI ---
            const logPayloadError: LogEventPayload = {
                eventType: Severity.ERROR,
                description: `Lỗi khi tạo cấu hình '${data.name}' (Loại: ${data.deviceType}, Vị trí: ${data.locationId}): ${error.message}`
            };
            this.eventEmitter.emit(LOG_EVENT, logPayloadError);
            // --- KẾT THÚC BỔ SUNG ---

            throw new InternalServerErrorException('Lỗi khi tạo cấu hình');
        }
    }

    async update(data: ConfigurationUpdateDto): Promise<string> {
        let oldConfigData: { name: string, value: number, deviceType: DeviceType } | null = null;
        try {
            const existingConfig = await this.prisma.configuration.findUnique({
                where: { configId: data.configId },
            });

            if (!existingConfig) {
                throw new NotFoundException('Không tìm thấy cấu hình');
            }

            oldConfigData = existingConfig;

            await this.prisma.configuration.update({
                where: { configId: data.configId },
                data: {
                    name: data.name,
                    value: data.value,
                    locationId: data.locationId,
                    deviceType: data.deviceType,
                },
            });

            // --- BỔ SUNG LOG ---
            const logPayloadSuccess: LogEventPayload = {
                eventType: Severity.INFO,
                description: `Cấu hình '${oldConfigData.name}' (ID: ${data.configId}) đã được cập nhật. Dữ liệu mới: { Tên: ${data.name}, Giá trị: ${data.value}, Loại: ${data.deviceType}, Vị trí: ${data.locationId} }`
            };
            this.eventEmitter.emit(LOG_EVENT, logPayloadSuccess);
            // --- KẾT THÚC BỔ SUNG ---

            return 'Cập nhật cấu hình thành công';
        } catch (error) {

            // --- BỔ SUNG LOG LỖI ---
            const logPayloadError: LogEventPayload = {
                eventType: Severity.ERROR,
                description: `Lỗi khi cập nhật cấu hình ID ${data.configId} (Tên cũ: '${oldConfigData?.name}'): ${error.message}`
            };
            this.eventEmitter.emit(LOG_EVENT, logPayloadError);
            // --- KẾT THÚC BỔ SUNG ---

            throw new InternalServerErrorException('Lỗi khi cập nhật cấu hình');
        }
    }

    async delete(data: ConfigurationDeleteDto): Promise<string> {
        let configToDeleteData: { name: string, configId: string } | null = null;
        try {
            const existingConfig = await this.prisma.configuration.findUnique({
                where: { configId: data.configId },
            });

            if (!existingConfig) {
                throw new NotFoundException('Không tìm thấy cấu hình');
            }
            configToDeleteData = existingConfig;

            await this.prisma.configuration.delete({
                where: { configId: data.configId },
            });

            // --- BỔ SUNG LOG ---
            const logPayloadSuccess: LogEventPayload = {
                eventType: Severity.INFO,
                description: `Cấu hình '${configToDeleteData.name}' (ID: ${configToDeleteData.configId}) đã được xóa.`
            };
            this.eventEmitter.emit(LOG_EVENT, logPayloadSuccess);
            // --- KẾT THÚC BỔ SUNG ---

            return 'Xóa cấu hình thành công';
        } catch (error) {

            // --- BỔ SUNG LOG LỖI ---
            const logPayloadError: LogEventPayload = {
                eventType: Severity.ERROR,
                description: `Lỗi khi xóa cấu hình ID ${data.configId} (Tên: '${configToDeleteData?.name}'): ${error.message}`
            };
            this.eventEmitter.emit(LOG_EVENT, logPayloadError);
            // --- KẾT THÚC BỔ SUNG ---

            throw new InternalServerErrorException('Lỗi khi xóa cấu hình');
        }
    }

    async getAll(query: ConfigurationQueryDto): Promise<ConfigurationPaginatedDto> {
        try {
            const { page, items_per_page, search, deviceType } = query;
            const skip = (page - 1) * items_per_page;

            const where: any = {};
            if (search) {
                where.name = { contains: search, mode: 'insensitive' };
            }
            if (deviceType && deviceType !== 'ALL') {
                where.deviceType = deviceType;
            }

            const [configurations, total] = await this.prisma.$transaction([
                this.prisma.configuration.findMany({
                    where,
                    skip,
                    take: items_per_page,
                    orderBy: { lastUpdated: 'desc' },
                }),
                this.prisma.configuration.count({ where }),
            ]);

            const lastPage = Math.ceil(total / items_per_page);
            return {
                configurations,
                total,
                currentPage: page,
                nextPage: page < lastPage ? page + 1 : null,
                prevPage: page > 1 ? page - 1 : null,
                lastPage,
            };
        } catch (error) {
            throw new InternalServerErrorException('Lỗi khi lấy danh sách cấu hình');
        }
    }

    async getWithFilter(query: ConfigurationFilterDto): Promise<ConfigurationListDto> {
        try {
            const configurations = await this.prisma.configuration.findMany({
                where: {
                    locationId: query.locationId,
                    deviceType: query.deviceType,
                },
                orderBy: { lastUpdated: 'desc' },
            });
            return { configurations };
        } catch (error) {
            throw new InternalServerErrorException('Lỗi khi lấy danh sách cấu hình theo bộ lọc');
        }
    }
}