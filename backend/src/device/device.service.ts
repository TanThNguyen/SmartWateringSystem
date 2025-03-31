import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AddDeviceDto, DeleteDevicesDto, FindAllDevicesDto, GetDevicesRequestDto, InfoDevicesDto, DeviceIdDto, EditDeviceDto } from './dto';
import { DeviceStatus, DeviceType, Prisma, Severity } from '@prisma/client';
import { DeviceFactory } from './factories/device.factory';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LOG_EVENT, LogEventPayload } from 'src/log/dto';
import { NOTIFICATION_EVENT, NotificationEventPayload, NotificationEventContext } from "src/notification/dto";

@Injectable()
export class DeviceService {
    private readonly logger = new Logger(DeviceService.name);

    constructor(
        private prismaService: PrismaService,
        private deviceFactory: DeviceFactory,
        private eventEmitter: EventEmitter2,
    ) { }

    async add(addDeviceDto: AddDeviceDto): Promise<string> {
        const { name, type, locationName, status } = addDeviceDto;
        let addedDeviceId: string | null = null;

        try {
            const location = await this.prismaService.location.findUnique({
                where: { name: locationName },
                select: { locationId: true },
            });
            if (!location) {
                throw new NotFoundException(`Không tìm thấy vị trí với tên: ${locationName}`);
            }

            const handler = this.deviceFactory.getHandler(type);
            handler.validateAddData?.(addDeviceDto);

            await this.prismaService.$transaction(async (prisma) => {
                const device = await prisma.device.create({
                    data: {
                        name,
                        type,
                        locationId: location.locationId,
                        status,
                    },
                });
                addedDeviceId = device.deviceId;
                await handler.createSpecifics(prisma, device.deviceId, addDeviceDto);
            });

            // --- BỔ SUNG LOG & NOTIFICATION ---
            const logPayloadSuccess: LogEventPayload = {
                deviceId: addedDeviceId!, // Use the stored ID
                eventType: Severity.INFO,
                description: `Thiết bị mới '${name}' (Loại: ${type}, Vị trí: ${locationName}, ID: ${addedDeviceId}) đã được thêm.`
            };
            this.eventEmitter.emit(LOG_EVENT, logPayloadSuccess);

            // // Tùy chọn: Gửi thông báo (ví dụ: cho admin)
            // const notiContext: NotificationEventContext = { deviceId: addedDeviceId!, userId: undefined /* Có thể thêm ID người thêm */ };
            // const notiPayload: NotificationEventPayload = {
            //     severity: Severity.INFO,
            //     messageTemplate: `Thiết bị mới {{deviceId}} ('${name}') đã được thêm vào hệ thống.`,
            //     context: notiContext
            // };
            // this.eventEmitter.emit(NOTIFICATION_EVENT, notiPayload);
            // --- KẾT THÚC BỔ SUNG ---

            return 'Thêm thiết bị thành công!';

        } catch (error) {

            // --- BỔ SUNG LOG LỖI ---
            const logPayloadError: LogEventPayload = {
                deviceId: addedDeviceId ?? undefined, // Log ID nếu đã tạo được device record
                eventType: Severity.ERROR,
                description: `Lỗi khi thêm thiết bị '${name}' (Loại: ${type}, Vị trí: ${locationName}): ${error.message}`
            };
            this.eventEmitter.emit(LOG_EVENT, logPayloadError);
            // --- KẾT THÚC BỔ SUNG ---

            if (error instanceof NotFoundException || error instanceof BadRequestException || error instanceof InternalServerErrorException) {
                throw error;
            }

            console.error(`Lỗi khi thêm thiết bị:`, error);
            throw new InternalServerErrorException(`Đã xảy ra lỗi khi thêm thiết bị: ${error.message}`);
        }
    }

    async deleteMany(deleteDevicesDto: DeleteDevicesDto): Promise<string> {
        const { deviceIds } = deleteDevicesDto;
        if (!deviceIds || deviceIds.length === 0) {
            throw new BadRequestException('Danh sách ID thiết bị cần vô hiệu hóa không được để trống!');
        }
        try {
            // Lấy thông tin thiết bị trước khi cập nhật để log
            const devicesToUpdate = await this.prismaService.device.findMany({
                where: { deviceId: { in: deviceIds }, status: DeviceStatus.ACTIVE }, // Chỉ lấy những thiết bị đang ACTIVE
                select: { deviceId: true, name: true }
            });

            if (devicesToUpdate.length === 0) {
                // Nếu không có thiết bị nào đang ACTIVE trong danh sách, không cần làm gì thêm
                this.logger.warn(`Không tìm thấy thiết bị nào đang hoạt động trong danh sách để vô hiệu hóa: ${deviceIds.join(', ')}`);
                // Có thể throw lỗi hoặc trả về thông báo khác tùy yêu cầu
                throw new NotFoundException('Không tìm thấy thiết bị nào đang hoạt động trong danh sách để vô hiệu hóa.');
            }

            const actualIdsToUpdate = devicesToUpdate.map(d => d.deviceId);
            const deviceNames = devicesToUpdate.map(d => `'${d.name}' (ID: ${d.deviceId})`).join(', ');


            const countResult = await this.prismaService.device.updateMany({
                where: { deviceId: { in: actualIdsToUpdate } }, // Chỉ cập nhật những ID thực sự tồn tại và active
                data: { status: DeviceStatus.INACTIVE },
            });

            // --- BỔ SUNG LOG & NOTIFICATION ---
            const logPayloadSuccess: LogEventPayload = {
                eventType: Severity.INFO,
                description: `Đã vô hiệu hóa ${countResult.count} thiết bị: ${deviceNames}.`
            };
            this.eventEmitter.emit(LOG_EVENT, logPayloadSuccess);

            // Gửi thông báo (ví dụ: cho admin)
            const notiContext: NotificationEventContext = { /* Thêm context nếu cần */ };
            const notiPayload: NotificationEventPayload = {
                severity: Severity.WARNING, // Hành động vô hiệu hóa có thể là cảnh báo
                messageTemplate: `Đã vô hiệu hóa ${countResult.count} thiết bị: ${deviceNames}.`,
                context: notiContext
            };
            this.eventEmitter.emit(NOTIFICATION_EVENT, notiPayload);
            // --- KẾT THÚC BỔ SUNG ---


            return `Đã vô hiệu hóa ${countResult.count} thiết bị thành công!`; // Original return
        } catch (error) {
            // --- BỔ SUNG LOG LỖI ---
            const logPayloadError: LogEventPayload = {
                eventType: Severity.ERROR,
                description: `Lỗi khi vô hiệu hóa các thiết bị [${deviceIds.join(', ')}]: ${error.message}`
            };
            this.eventEmitter.emit(LOG_EVENT, logPayloadError);
            // --- KẾT THÚC BỔ SUNG ---

            this.logger.error(`Lỗi khi vô hiệu hóa thiết bị: ${error.message}`, error.stack); // Use logger
            if (error instanceof BadRequestException || error instanceof NotFoundException || error instanceof InternalServerErrorException) {
                throw error;
            }
            throw new InternalServerErrorException(`Đã xảy ra lỗi khi vô hiệu hóa thiết bị: ${error.message}`);
        }
    }

    async getAllDevices(query: GetDevicesRequestDto): Promise<FindAllDevicesDto> {
        try {
            const page = query.page || 1;
            const itemsPerPage = query.items_per_page || 5;
            const { order, search, status, locationName } = query;
            const skip = (page - 1) * itemsPerPage;

            const whereCondition: Prisma.DeviceWhereInput = {
                ...(search && {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' } },
                        { location: { name: { contains: search, mode: 'insensitive' } } }
                    ]
                }),
                ...(status !== 'ALL' && { status }),
                ...(locationName && { location: { name: { contains: locationName, mode: 'insensitive' } } })
            };

            const [devices, total] = await this.prismaService.$transaction([
                this.prismaService.device.findMany({
                    where: whereCondition,
                    orderBy: { updatedAt: order === 'asc' ? 'asc' : 'desc' },
                    take: itemsPerPage,
                    skip: skip,
                    include: { location: { select: { name: true } } } // Chỉ lấy tên location
                }),
                this.prismaService.device.count({ where: whereCondition })
            ]);

            const lastPage = Math.ceil(total / itemsPerPage);
            const nextPage = page + 1 > lastPage ? null : page + 1;
            const prevPage = page - 1 < 1 ? null : page - 1;

            const formattedDevices: InfoDevicesDto[] = devices.map(device => ({
                deviceId: device.deviceId,
                name: device.name,
                type: device.type,
                locationName: device.location?.name || 'Không xác định',
                status: device.status,
                updatedAt: device.updatedAt
            }));

            return {
                devices: formattedDevices,
                total,
                currentPage: page,
                nextPage,
                prevPage,
                lastPage
            };
        } catch (error) {
            console.error(`Lỗi khi lấy danh sách thiết bị:`, error);
            throw new InternalServerErrorException(`Lỗi khi lấy danh sách thiết bị: ${error.message}`);
        }
    }

    async toggleStatus(body: DeviceIdDto): Promise<string> {
        const { deviceId } = body;
        let originalStatus: DeviceStatus | null = null;
        let deviceName: string | null = null;
        let newStatusResult: DeviceStatus | null = null;

        try {
            const result = await this.prismaService.$transaction(async (prisma) => {
                const device = await prisma.device.findUnique({
                    where: { deviceId },
                    select: { deviceId: true, status: true, type: true, name: true }, // Lấy thêm name
                });

                if (!device) {
                    throw new NotFoundException('Không tìm thấy thiết bị.');
                }
                originalStatus = device.status; // Store original status
                deviceName = device.name; // Store name

                const handler = this.deviceFactory.getHandler(device.type);
                const statusAfterToggle = await handler.toggleStatus(prisma, device); // Hàm này sẽ cập nhật DB và trả về status mới
                newStatusResult = statusAfterToggle; // Store result status
                return statusAfterToggle; // Return from transaction
            });

            // --- BỔ SUNG LOG & NOTIFICATION ---
            const logPayload: LogEventPayload = {
                deviceId: deviceId,
                eventType: Severity.INFO,
                description: `Trạng thái của thiết bị '${deviceName}' đã được chuyển từ ${originalStatus} thành ${newStatusResult}.`
            };
            this.eventEmitter.emit(LOG_EVENT, logPayload);

            //  // Tùy chọn: Gửi thông báo
            // const notiContext: NotificationEventContext = { deviceId: deviceId };
            // const notiPayload: NotificationEventPayload = {
            //     severity: Severity.INFO,
            //     messageTemplate: `Trạng thái thiết bị {{deviceId}} ('${deviceName}') đã được chuyển thành ${newStatusResult}.`,
            //     context: notiContext
            // };
            // this.eventEmitter.emit(NOTIFICATION_EVENT, notiPayload);
            // --- KẾT THÚC BỔ SUNG ---

            return `Thiết bị đã chuyển sang trạng thái ${result}.`; // Original return

        } catch (error) {
            // --- BỔ SUNG LOG LỖI ---
            const logPayloadError: LogEventPayload = {
                deviceId: deviceId,
                eventType: Severity.ERROR,
                description: `Lỗi khi thay đổi trạng thái thiết bị '${deviceName ?? deviceId}': ${error.message}`
            };
            this.eventEmitter.emit(LOG_EVENT, logPayloadError);
            // --- KẾT THÚC BỔ SUNG ---

            this.logger.error(`Lỗi khi thay đổi trạng thái thiết bị ${deviceId}: ${error.message}`, error.stack); // Use logger
            if (error instanceof NotFoundException || error instanceof BadRequestException || error instanceof InternalServerErrorException) {
                throw error; // Re-throw specific handled errors
            }
            throw new InternalServerErrorException(`Lỗi khi thay đổi trạng thái thiết bị: ${error.message}`);
        }
    }

    async getOneDevice(deviceId: string): Promise<any> {
        try {
            // 1. Lấy thông tin device cơ bản
            const device = await this.prismaService.device.findUnique({
                where: { deviceId },
                include: {
                    location: { select: { name: true } },
                },
            });

            if (!device) {
                throw new NotFoundException(`Không tìm thấy thiết bị với ID: ${deviceId}`);
            }

            // 2. Lấy handler và thông tin chi tiết đặc thù
            const handler = this.deviceFactory.getHandler(device.type);
            const specifics = await handler.getSpecifics(this.prismaService, deviceId);

            // 3. Kết hợp thông tin
            const result = {
                deviceId: device.deviceId,
                name: device.name,
                type: device.type,
                status: device.status,
                locationName: device.location?.name || 'Không xác định',
                createdAt: device.createdAt,
                updatedAt: device.updatedAt,
                ...(specifics && { [device.type.toLowerCase()]: specifics }),
            };

            if (result[device.type.toLowerCase()]) {
                delete result[device.type.toLowerCase()][`${device.type.toLowerCase()}Id`];
                if (result[device.type.toLowerCase()].sensorId) delete result[device.type.toLowerCase()].sensorId;
            }


            return result;

        } catch (error) {
            if (error instanceof NotFoundException || error instanceof InternalServerErrorException) {
                throw error;
            }
            console.error(`Lỗi khi lấy thông tin thiết bị ${deviceId}:`, error);
            throw new InternalServerErrorException(`Lỗi khi lấy thông tin thiết bị: ${error.message}`);
        }
    }

    async editDevice(editDeviceDto: EditDeviceDto): Promise<string> {
        const { deviceId, name, status, locationId } = editDeviceDto;

        try {
            return await this.prismaService.$transaction(async (prisma) => {
                const device = await prisma.device.findUnique({
                    where: { deviceId },
                    select: { type: true, status: true },
                });

                if (!device) {
                    throw new NotFoundException(`Không tìm thấy thiết bị với ID: ${deviceId}`);
                }

                const handler = this.deviceFactory.getHandler(device.type);
                const deviceUpdateData: Prisma.DeviceUpdateInput = {};

                if (name !== undefined) deviceUpdateData.name = name;
                if (locationId !== undefined) {
                    const locationExists = await prisma.location.findUnique({ where: { locationId } });
                    if (!locationExists) throw new BadRequestException(`Location với ID ${locationId} không tồn tại.`);
                    deviceUpdateData.location = { connect: { locationId } };
                }

                if (status !== undefined && status !== device.status) {
                    await handler.toggleStatus(prisma, { deviceId, status: device.status, type: device.type });
                }

                if (Object.keys(deviceUpdateData).length > 0) {
                    await prisma.device.update({
                        where: { deviceId },
                        data: deviceUpdateData,
                    });
                }

                await handler.updateSpecifics(prisma, deviceId, editDeviceDto);

                // --- BỔ SUNG LOG & NOTIFICATION ---
                const logPayloadSuccess: LogEventPayload = {
                    deviceId: deviceId,
                    eventType: Severity.INFO,
                    description: `Thiết bị '${name}' (ID: ${deviceId}) đã được cập nhật.`
                    // Có thể thêm chi tiết các trường đã thay đổi nếu cần
                };
                this.eventEmitter.emit(LOG_EVENT, logPayloadSuccess);

                // Tùy chọn: Gửi thông báo
                // const notiContext: NotificationEventContext = { deviceId: deviceId };
                // const notiPayload: NotificationEventPayload = { ... };
                // this.eventEmitter.emit(NOTIFICATION_EVENT, notiPayload);
                // --- KẾT THÚC BỔ SUNG ---

                return `Cập nhật thiết bị ${deviceId} thành công!`;
            });
        } catch (error) {

            // --- BỔ SUNG LOG LỖI ---
            const logPayloadError: LogEventPayload = {
                deviceId: deviceId,
                eventType: Severity.ERROR,
                description: `Lỗi khi cập nhật thiết bị '${name ?? deviceId}': ${error.message}`
            };
            this.eventEmitter.emit(LOG_EVENT, logPayloadError);
            // --- KẾT THÚC BỔ SUNG ---
            if (error instanceof NotFoundException || error instanceof BadRequestException || error instanceof InternalServerErrorException) {
                throw error;
            }
            console.error(`Lỗi khi cập nhật thiết bị ${deviceId}:`, error);
            throw new InternalServerErrorException(`Đã xảy ra lỗi khi cập nhật thiết bị: ${error.message}`);
        }
    }

}